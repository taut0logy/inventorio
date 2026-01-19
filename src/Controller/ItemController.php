<?php

namespace App\Controller;

use App\Entity\Inventory;
use App\Entity\InventoryField;
use App\Entity\Item;
use App\Entity\ItemFieldValue;
use App\Entity\User;
use App\Repository\ActivityRepository;
use App\Repository\InventoryFieldRepository;
use App\Repository\ItemRepository;
use App\Repository\ItemFieldValueRepository;
use App\Repository\TagRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/items')]
class ItemController extends AbstractController
{
    /**
     * Generate a custom ID based on the inventory's idGenerationConfig elements.
     */
    private function generateCustomId(Inventory $inventory, ItemRepository $itemRepository): string
    {
        $config = $inventory->getIdGenerationConfig();
        
        // Handle old format (backward compatibility)
        if (isset($config['type']) && !isset($config['elements'])) {
            if ($config['type'] === 'manual') {
                return ''; // Manual entry required
            }
            // Old auto format
            $prefix = $config['prefix'] ?? '';
            $separator = $config['separator'] ?? '-';
            $minDigits = $config['minDigits'] ?? 4;
            $nextSeq = $itemRepository->getNextSequenceNumber($inventory);
            return $prefix . $separator . str_pad((string)$nextSeq, (int)$minDigits, '0', STR_PAD_LEFT);
        }
        
        // New elements-based format
        $elements = $config['elements'] ?? [];
        if (empty($elements)) {
            return ''; // No elements = manual entry
        }
        
        $parts = [];
        foreach ($elements as $element) {
            $parts[] = $this->generateElement($element, $inventory, $itemRepository);
        }
        
        return implode('', $parts);
    }
    
    /**
     * Generate a single ID element based on its type.
     */
    private function generateElement(array $element, Inventory $inventory, ItemRepository $itemRepository): string
    {
        $type = $element['type'] ?? 'fixed';
        
        switch ($type) {
            case 'fixed':
                return $element['value'] ?? '';
                
            case 'random20':
                $value = random_int(0, 0xFFFFF); // 20-bit max
                return ($element['format'] ?? 'hex') === 'hex' 
                    ? strtoupper(dechex($value)) 
                    : (string)$value;
                
            case 'random32':
                $value = random_int(0, 0xFFFFFFFF); // 32-bit max
                return ($element['format'] ?? 'hex') === 'hex' 
                    ? strtoupper(dechex($value)) 
                    : (string)$value;
                
            case 'random6':
                return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                
            case 'random9':
                return str_pad((string)random_int(0, 999999999), 9, '0', STR_PAD_LEFT);
                
            case 'guid':
                return \Symfony\Component\Uid\Uuid::v4()->toRfc4122();
                
            case 'date':
                $now = new \DateTime();
                $format = $element['format'] ?? 'YYYY';
                return match ($format) {
                    'YYYYMMDD' => $now->format('Ymd'),
                    'YYYY-MM-DD' => $now->format('Y-m-d'),
                    default => $now->format('Y'), // YYYY
                };
                
            case 'sequence':
                $minDigits = (int)($element['minDigits'] ?? 4);
                $nextSeq = $itemRepository->getNextSequenceNumber($inventory);
                return str_pad((string)$nextSeq, $minDigits, '0', STR_PAD_LEFT);
                
            default:
                return '';
        }
    }

    /**
     * Validate custom field values against field definitions
     */
    private function validateFieldValues(array $fieldValues, Inventory $inventory): array
    {
        $errors = [];
        
        foreach ($inventory->getFields() as $field) {
            if ($field->isHidden()) {
                continue;
            }
            
            $fieldId = $field->getId()->toRfc4122();
            $value = $fieldValues[$fieldId] ?? null;
            $label = $field->getLabel();
            
            // Required check
            if ($field->isRequired() && ($value === '' || $value === null)) {
                $errors[] = "$label is required.";
                continue;
            }
            
            if ($value === '' || $value === null) {
                continue;
            }
            
            $type = $field->getType();
            
            // Regex check (string, text, link)
            if ($field->getRegex() && in_array($type, ['string', 'text', 'link'])) {
                $pattern = '/' . str_replace('/', '\\/', $field->getRegex()) . '/';
                if (@preg_match($pattern, $value) !== 1) {
                    $errors[] = "$label format is invalid.";
                }
            }
            
            // Min/Max check (number)
            if ($type === 'number') {
                $numVal = (float)$value;
                $min = $field->getMin();
                $max = $field->getMax();
                
                if ($min !== null && $numVal < $min) {
                    $errors[] = "$label must be at least $min.";
                }
                if ($max !== null && $numVal > $max) {
                    $errors[] = "$label must be at most $max.";
                }
            }
            
            // Select options check
            if ($type === 'select') {
                $options = $field->getOptions() ?? [];
                if (!empty($options) && !in_array($value, $options)) {
                    $errors[] = "$label must be one of the valid options.";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Save field values for an item
     */
    private function saveFieldValues(Item $item, array $fieldValues, Inventory $inventory, EntityManagerInterface $em): void
    {
        foreach ($inventory->getFields() as $field) {
            $fieldId = $field->getId()->toRfc4122();
            
            if (!array_key_exists($fieldId, $fieldValues)) {
                continue;
            }
            
            $value = $fieldValues[$fieldId];
            $item->setFieldValue($field, $value);
        }
    }

    #[Route('/new/{inventory}', name: 'app_item_new', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function new(
        Inventory $inventory,
        Request $request,
        ItemRepository $itemRepository,
        TagRepository $tagRepository,
        EntityManagerInterface $entityManager,
        ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        // Security check
        $this->denyAccessUnlessGranted('ITEM_ADD', $inventory);

        $data = json_decode($request->getContent(), true);
        
        // Handle ID Generation
        $config = $inventory->getIdGenerationConfig();
        $hasElements = !empty($config['elements']);
        $isOldAutoFormat = isset($config['type']) && $config['type'] === 'auto' && !$hasElements;
        
        if ($hasElements || $isOldAutoFormat) {
            // Auto-generate the ID
            $generatedId = $this->generateCustomId($inventory, $itemRepository);
            if (!empty($generatedId)) {
                $data['customId'] = $generatedId;
            }
        }

        // Basic validation
        if (empty($data['customId'])) {
            return $this->json(['error' => 'Custom ID is required'], 400);
        }

        // Check for duplicate Custom ID
        if ($itemRepository->customIdExists($inventory, $data['customId'])) {
            return $this->json(['error' => "Custom ID '{$data['customId']}' already exists. Please try again or check settings."], 409);
        }

        // Extract field values from data
        $fieldValues = $data['fieldValues'] ?? [];
        
        // Custom Field Validation
        $validationErrors = $this->validateFieldValues($fieldValues, $inventory);
        if (!empty($validationErrors)) {
            return $this->json(['error' => implode("\n", $validationErrors)], 400);
        }

        $item = new Item();
        $item->setInventory($inventory);
        $item->setCreatedBy($this->getUser());
        $item->setCustomId($data['customId']);
        $item->setSequenceNumber($itemRepository->getNextSequenceNumber($inventory));

        // Save field values
        $this->saveFieldValues($item, $fieldValues, $inventory, $entityManager);

        // Handle Tags
        if (isset($data['tags']) && is_array($data['tags'])) {
            foreach ($data['tags'] as $tagName) {
                if (trim($tagName) === '') continue;
                $tag = $tagRepository->findOrCreate($tagName);
                $entityManager->persist($tag);
                $item->addTag($tag);
            }
        }

        $entityManager->persist($item);
        $entityManager->flush();

        // Log activity
        /** @var User $user */
        $user = $this->getUser();
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($inventory, $user, 'item_add', $isAdmin, [
            'itemId' => $item->getId()->toRfc4122(),
            'customId' => $item->getCustomId()
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);

        return $this->json([
            'id' => $item->getId()->toRfc4122(),
            'customId' => $item->getCustomId(),
            'message' => 'Item created successfully'
        ], 201);
    }

    #[Route('/{id}', name: 'app_item_edit', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function edit(
        Item $item,
        Request $request,
        ItemRepository $itemRepository,
        TagRepository $tagRepository,
        EntityManagerInterface $entityManager,
        ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('ITEM_EDIT', $item->getInventory());

        $data = json_decode($request->getContent(), true);
        $inventory = $item->getInventory();
        
        // Validation: Check customId uniqueness if changed
        if (isset($data['customId']) && $data['customId'] !== $item->getCustomId()) {
            if ($itemRepository->customIdExists($inventory, $data['customId'], $item->getId()->toRfc4122())) {
                return $this->json(['error' => 'Custom ID already exists'], 400);
            }
            $item->setCustomId($data['customId']);
        }

        // Extract field values from data
        $fieldValues = $data['fieldValues'] ?? [];

        // Custom Field Validation
        $validationErrors = $this->validateFieldValues($fieldValues, $inventory);
        if (!empty($validationErrors)) {
            return $this->json(['error' => implode("\n", $validationErrors)], 400);
        }

        // Optimistic Locking Check
        if (isset($data['version']) && $item->getVersion() !== (int)$data['version']) {
            return $this->json(['error' => 'Conflict detected. The item has been modified by another user.'], 409);
        }

        // Save field values
        $this->saveFieldValues($item, $fieldValues, $inventory, $entityManager);

        // Handle Tags (Sync)
        if (isset($data['tags']) && is_array($data['tags'])) {
            // Remove existing tags
            foreach ($item->getTags() as $tag) {
                $item->removeTag($tag);
            }
            
            // Add new tags
            foreach ($data['tags'] as $tagName) {
                if (trim($tagName) === '') continue;
                $tag = $tagRepository->findOrCreate($tagName);
                $entityManager->persist($tag);
                $item->addTag($tag);
            }
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json(['error' => 'Conflict detected. The item has been modified by another user.'], 409);
        }

        // Log activity
        /** @var User $user */
        $user = $this->getUser();
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($item->getInventory(), $user, 'item_edit', $isAdmin, [
            'itemId' => $item->getId()->toRfc4122(),
            'customId' => $item->getCustomId()
        ]);
        
        $notifier->notifyNewActivity($item->getInventory()->getId()->toRfc4122(), $activity);

        return $this->json([
            'message' => 'Item updated successfully',
            'version' => $item->getVersion()
        ]);
    }

    #[Route('/{id}', name: 'app_item_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(
        Item $item,
        EntityManagerInterface $entityManager,
        ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('ITEM_DELETE', $item->getInventory());

        // Capture info before delete
        /** @var User $user */
        $user = $this->getUser();
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $inventory = $item->getInventory();
        $itemId = $item->getId()->toRfc4122();
        $customId = $item->getCustomId();

        // Soft delete logic
        $entityManager->remove($item);
        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json(['error' => 'Conflict detected. The item has been modified by another user.'], 409);
        }

        $activity = $activityRepo->logActivity($inventory, $user, 'item_delete', $isAdmin, [
            'itemId' => $itemId,
            'customId' => $customId
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);

        return $this->json(['message' => 'Item deleted successfully']);
    }

    #[Route('/batch-delete', name: 'app_item_batch_delete', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function batchDelete(
        Request $request,
        ItemRepository $itemRepository,
        EntityManagerInterface $entityManager
    ): Response {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];

        if (empty($ids)) {
            return $this->json(['error' => 'No IDs provided'], 400);
        }

        // Fetch all items to verify ownership
        foreach ($ids as $id) {
            $item = $itemRepository->find($id);
            if ($item && $this->isGranted('ITEM_DELETE', $item->getInventory())) {
                $entityManager->remove($item);
            }
        }

        $entityManager->flush();

        return $this->json(['message' => 'Items deleted successfully']);
    }

    #[Route('/{id}/restore', name: 'app_item_restore', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function restore(
        string $id, 
        ItemRepository $repo, 
        EntityManagerInterface $em
    ): Response {
        if ($em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->disable('softdeleteable');
        }
        
        $item = $repo->find($id);

        if (!$this->isGranted('ROLE_ADMIN')) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
             throw $this->createAccessDeniedException('Only admins can restore items.');
        }

        if (!$item) {
            if (!$em->getFilters()->isEnabled('softdeleteable')) {
                $em->getFilters()->enable('softdeleteable');
            }
            throw $this->createNotFoundException();
        }

        $item->setDeletedAt(null);
        $em->flush();
        if (!$em->getFilters()->isEnabled('softdeleteable')) {
             $em->getFilters()->enable('softdeleteable');
        }

        return $this->json(['message' => 'Item restored']);
    }

    #[Route('/{id}/permanent', name: 'app_item_permanent_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function permanentDelete(
        string $id, 
        ItemRepository $repo, 
        EntityManagerInterface $em
    ): Response {
        if ($em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->disable('softdeleteable');
        }

        $item = $repo->find($id);

        if (!$this->isGranted('ROLE_ADMIN')) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
             throw $this->createAccessDeniedException('Only admins can permanently delete items.');
        }

        if (!$item) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
            throw $this->createNotFoundException();
        }

        $em->createQuery('DELETE FROM App\Entity\Item i WHERE i.id = :id')
           ->setParameter('id', $item->getId())
           ->execute();

        if (!$em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->enable('softdeleteable');
        }

        return $this->json(['message' => 'Permanently deleted']);
    }

    #[Route('/{id}/like', name: 'app_item_like', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function toggleLike(
        Item $item, 
        EntityManagerInterface $entityManager,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        // Check if user is fully authenticated (should be covered by IsGranted)
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $isLiked = false;
        if ($item->isLikedBy($user)) {
            $item->removeLikedBy($user);
            $isLiked = false;
        } else {
            $item->addLikedBy($user);
            $isLiked = true;
        }

        try {
            $entityManager->flush();
            $notifier->notifyItemStats(
                $item->getInventory()->getId()->toRfc4122(),
                $item->getId()->toRfc4122(),
                ['likes' => $item->getLikeCount()]
            );
        } catch (\Exception $e) {
             return $this->json(['error' => 'Error updating like status'], 500);
        }

        return $this->json([
            'isLiked' => $isLiked,
            'likeCount' => $item->getLikeCount()
        ]);
    }
}
