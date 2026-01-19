<?php

namespace App\Controller;

use App\Entity\Inventory;
use App\Repository\InventoryRepository;
use App\Repository\CategoryRepository;
use App\Repository\TagRepository;
use App\Repository\ItemRepository;
use App\Repository\UserRepository;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/inventory')]
class InventoryController extends AbstractController
{
    #[Route('/', name: 'app_inventory_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(
        Request $request,
        InventoryRepository $inventoryRepository,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): Response {
        $showDeleted = $request->query->getBoolean('deleted');
        
        if ($showDeleted && $entityManager->getFilters()->isEnabled('softdeleteable')) {
            $entityManager->getFilters()->disable('softdeleteable');
        }

        $inventories = $inventoryRepository->findBy(
            ['creator' => $this->getUser()], 
            ['createdAt' => 'DESC']
        );

        if ($showDeleted) {
             // Re-enable filter for safety
             if (!$entityManager->getFilters()->isEnabled('softdeleteable')) {
                 $entityManager->getFilters()->enable('softdeleteable');
             }
             
             // Filter in memory to only return actually deleted ones
             $inventories = array_filter($inventories, fn($i) => $i->getDeletedAt() !== null);
        }

        if ($user = $this->getUser()) {
            $sharedInventories = $inventoryRepository->findSharedWithUser($user);
        } else {
            $sharedInventories = [];
        }

        return $this->render('inventory/index.html.twig', [
            'inventories' => $inventories, // Owned
            'sharedInventories' => $sharedInventories,
            'categories' => $categoryRepository->findAllOrdered(),
            'showDeleted' => $showDeleted,
        ]);
    }

    #[Route('/new', name: 'app_inventory_new', methods: ['GET', 'POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function new(
        Request $request, 
        EntityManagerInterface $entityManager, 
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository
    ): Response {
        // Handle API POST request
        if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);
            
            if (!$title = $data['title'] ?? null) {
                return $this->json(['error' => 'Title is required'], 400);
            }
            
            if (!$categoryId = $data['category'] ?? null) {
                return $this->json(['error' => 'Category is required'], 400);
            }

            $category = $categoryRepository->find($categoryId);
            if (!$category) {
                return $this->json(['error' => 'Invalid category'], 400);
            }

            $inventory = new Inventory();
            $inventory->setTitle($title);
            $inventory->setDescription($data['description'] ?? null);
            $inventory->setPublic($data['isPublic'] ?? false);
            $inventory->setCategory($category);

            $inventory->setCreator($this->getUser());

            // Handle Tags
            if (isset($data['tags']) && is_array($data['tags'])) {
                foreach ($data['tags'] as $tagName) {
                    if (trim($tagName) === '') continue;
                    $tag = $tagRepository->findOrCreate($tagName);
                    $entityManager->persist($tag);
                    $inventory->addTag($tag);
                }
            }

            // Create default fields
            $inventory->createDefaultFields();

            $entityManager->persist($inventory);
            $entityManager->flush();

            return $this->json([
                'id' => $inventory->getId()->toRfc4122(),
                'message' => 'Inventory created successfully',
                'redirect' => $this->generateUrl('app_inventory_show', ['id' => $inventory->getId()])
            ]);
        }

        // Fallback for direct access (though we mostly use the modal)
        return $this->render('inventory/new.html.twig');
    }

    #[Route('/{id}/edit', name: 'app_inventory_edit', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function edit(
        string $id,
        Request $request,
        InventoryRepository $inventoryRepository,
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository,
        EntityManagerInterface $entityManager
    ): Response {
        $inventory = $inventoryRepository->find($id);

        if (!$inventory) {
             throw $this->createNotFoundException('Inventory not found');
        }
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);

        $data = json_decode($request->getContent(), true);

        // Optimistic Locking Check
        // Auto-save logic handles this via 'expectedVersion', but manual save should also support 'version'
        if (isset($data['version']) && $inventory->getVersion() !== (int)$data['version']) {
            return $this->json(['error' => 'Conflict detected. The inventory has been modified by another user.'], 409);
        }

        if (!$title = $data['title'] ?? null) {
            return $this->json(['error' => 'Title is required'], 400);
        }

        if (!$categoryId = $data['category'] ?? null) {
             return $this->json(['error' => 'Category is required'], 400);
        }

        $category = $categoryRepository->find($categoryId);
        if (!$category) {
            return $this->json(['error' => 'Invalid category'], 400);
        }

        $inventory->setTitle($title);
        $inventory->setDescription($data['description'] ?? null);
        $inventory->setPublic($data['isPublic'] ?? false);
        $inventory->setCategory($category);

        // Update Tags if provided
        if (isset($data['tags']) && is_array($data['tags'])) {
             // Remove existing tags
             foreach ($inventory->getTags() as $tag) {
                 $inventory->removeTag($tag);
             }
             
             // Add new tags
             foreach ($data['tags'] as $tagName) {
                 if (trim($tagName) === '') continue;
                 $tag = $tagRepository->findOrCreate($tagName);
                 $entityManager->persist($tag);
                 $inventory->addTag($tag);
             }
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json(['error' => 'Conflict detected. The inventory has been modified by another user.'], 409);
        }

        return $this->json([
            'id' => $inventory->getId()->toRfc4122(),
            'message' => 'Inventory updated successfully'
        ]);
    }

    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function batchDelete(Request $request, InventoryRepository $inventoryRepository, EntityManagerInterface $entityManager): Response
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];

        if (empty($ids)) {
            return $this->json(['error' => 'No IDs provided'], 400);
        }

        foreach ($ids as $id) {
            $inventory = $inventoryRepository->find($id);
            if ($inventory && $inventory->getCreator() === $this->getUser()) {
                $entityManager->remove($inventory);
            }
        }

        $entityManager->flush();

        return $this->json(['message' => 'Items deleted successfully']);
    }

    #[Route('/{id}/settings', name: 'app_inventory_settings', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function settings(
        Inventory $inventory,
        Request $request,
        EntityManagerInterface $entityManager,
        \App\Repository\InventoryFieldRepository $fieldRepository
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);

        $data = json_decode($request->getContent(), true);
        
        // Optimistic Locking Check
        if (isset($data['version']) && $inventory->getVersion() !== (int)$data['version']) {
            return $this->json(['error' => 'Conflict detected. The settings have been modified by another user.'], 409);
        }

        // Handle ID Generation Config
        if (isset($data['idGenerationConfig'])) {
            $inventory->setIdGenerationConfig($data['idGenerationConfig']);
        }

        // Handle Fields Config (EAV)
        if (isset($data['fields']) && is_array($data['fields'])) {
            $existingFieldIds = [];
            foreach ($inventory->getFields() as $f) {
                $existingFieldIds[$f->getId()->toRfc4122()] = $f;
            }

            $processedIds = [];
            foreach ($data['fields'] as $position => $fieldData) {
                $fieldId = $fieldData['id'] ?? null;
                
                if ($fieldId && isset($existingFieldIds[$fieldId])) {
                    // Update existing field
                    $field = $existingFieldIds[$fieldId];
                } else {
                    // Create new field
                    $field = new \App\Entity\InventoryField();
                    $field->setInventory($inventory);
                    $inventory->addField($field);
                }
                
                $field->setLabel($fieldData['label'] ?? 'Unnamed Field');
                $field->setType($fieldData['type'] ?? 'string');
                $field->setDescription($fieldData['description'] ?? null);
                $field->setPosition((int)$position);
                $field->setHidden((bool)($fieldData['hidden'] ?? false));
                $field->setRequired((bool)($fieldData['required'] ?? false));
                $field->setRegex($fieldData['regex'] ?? null);
                $field->setMin(isset($fieldData['min']) && $fieldData['min'] !== '' ? (float)$fieldData['min'] : null);
                $field->setMax(isset($fieldData['max']) && $fieldData['max'] !== '' ? (float)$fieldData['max'] : null);
                $field->setOptions($fieldData['options'] ?? null);
                
                $entityManager->persist($field);
                $processedIds[] = $field->getId()->toRfc4122();
            }
            
            // Remove fields that were deleted
            foreach ($existingFieldIds as $id => $field) {
                if (!in_array($id, $processedIds)) {
                    $inventory->removeField($field);
                    $entityManager->remove($field);
                }
            }
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json(['error' => 'Conflict detected. The settings have been modified by another user.'], 409);
        }

        return $this->json([
            'message' => 'Settings updated successfully',
            'version' => $inventory->getVersion(),
            'fields' => array_map(fn($f) => $f->toArray(), $inventory->getFields()->toArray())
        ]);
    }

    #[Route('/{id}/auto-save', name: 'app_inventory_auto_save', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function autoSave(
        Inventory $inventory,
        Request $request,
        EntityManagerInterface $entityManager,
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);

        $data = json_decode($request->getContent(), true);
        
        // Optimistic locking: check expected version
        $expectedVersion = $data['expectedVersion'] ?? null;
        if ($expectedVersion !== null && $inventory->getVersion() !== (int)$expectedVersion) {
            return $this->json([
                'error' => 'Version conflict',
                'message' => 'This inventory has been modified by another user.',
                'currentVersion' => $inventory->getVersion()
            ], 409);
        }

        // Update basic fields if provided
        if (isset($data['title']) && trim($data['title']) !== '') {
            $inventory->setTitle($data['title']);
        }
        
        if (array_key_exists('description', $data)) {
            $inventory->setDescription($data['description']);
        }
        
        if (isset($data['isPublic'])) {
            $inventory->setPublic((bool)$data['isPublic']);
        }
        
        if (isset($data['category'])) {
            $category = $categoryRepository->find($data['category']);
            if ($category) {
                $inventory->setCategory($category);
            }
        }

        // Update tags if provided
        if (isset($data['tags']) && is_array($data['tags'])) {
            foreach ($inventory->getTags() as $tag) {
                $inventory->removeTag($tag);
            }
            foreach ($data['tags'] as $tagName) {
                if (trim($tagName) === '') continue;
                $tag = $tagRepository->findOrCreate($tagName);
                $entityManager->persist($tag);
                $inventory->addTag($tag);
            }
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json([
                'error' => 'Version conflict',
                'message' => 'This inventory has been modified by another user.',
                'currentVersion' => $inventory->getVersion()
            ], 409);
        }

        return $this->json([
            'success' => true,
            'message' => 'Auto-saved successfully',
            'version' => $inventory->getVersion()
        ]);
    }

    #[Route('/{id}', name: 'app_inventory_show', methods: ['GET'])]
    public function show(
        Inventory $inventory, 
        Request $request, 
        EntityManagerInterface $em, 
        ItemRepository $itemRepo,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_VIEW', $inventory);
        
        /** @var User|null $user */
        $user = $this->getUser();
        
        $sessionKey = 'viewed_inventory_' . $inventory->getId()->toRfc4122();
        if (!$request->getSession()->has($sessionKey)) {
            $inventory->incrementViewCount();
            $em->flush();
            $request->getSession()->set($sessionKey, true);
            
            // Log view activity (only once per session)
            if ($user) {
                $isAdmin = $this->isGranted('ROLE_ADMIN');
                $activityRepo->logActivity($inventory, $user, 'view', $isAdmin);
            }
            
            // Broadcast real-time stats update
            $notifier->notifyInventoryStats($inventory->getId()->toRfc4122(), [
                'likes' => $inventory->getLikeCount(),
                'views' => $inventory->getViewCount()
            ]);
        }
        
        $showDeleted = $request->query->getBoolean('deleted');
        $items = [];

        if ($showDeleted) {
            if ($em->getFilters()->isEnabled('softdeleteable')) {
                $em->getFilters()->disable('softdeleteable');
            }
            // Fetch items explicitly including deleted ones
            $items = $itemRepo->findByInventoryIncludeDeleted($inventory);
            if (!$em->getFilters()->isEnabled('softdeleteable')) {
                $em->getFilters()->enable('softdeleteable');
            }
               
             $items = array_filter($items, fn($i) => $i->getDeletedAt() !== null);
        }
        
        // Check if user has pending access request
        $hasRequestedAccess = false;
        if ($user && !$inventory->getSharedWith()->contains($user) && $inventory->getCreator() !== $user) {
            $hasRequestedAccess = $activityRepo->hasPendingRequest($inventory, $user);
        }

        return $this->render('inventory/show.html.twig', [
            'inventory' => $inventory,
            'isCreator' => $user === $inventory->getCreator(),
            'isCollaborator' => $user && ($inventory->getCreator() === $user || $inventory->getSharedWith()->contains($user) || $this->isGranted('ROLE_ADMIN')),
            'canAddItem' => $this->isGranted('ITEM_ADD', $inventory),
            'canEditItem' => $this->isGranted('ITEM_EDIT', $inventory),
            'canEditInventory' => $this->isGranted('INVENTORY_EDIT', $inventory),
            'canManageAccess' => $this->isGranted('INVENTORY_MANAGE_ACCESS', $inventory),
            'hasRequestedAccess' => $hasRequestedAccess,
            'showDeleted' => $showDeleted,
            'deletedItems' => $showDeleted ? $items : [],
            'likedItemIds' => $user ? $itemRepo->findLikedItemIds($inventory, $user) : [],
            'inventoryLiked' => $inventory->isLikedByUser($user),
            'inventoryLikeCount' => $inventory->getLikeCount(),
        ]);
    }
    #[Route('/{id}/restore', name: 'app_inventory_restore', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function restore(
        string $id, 
        InventoryRepository $repo, 
        EntityManagerInterface $em
    ): Response {
        if ($em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->disable('softdeleteable');
        }
        
        $inventory = $repo->find($id);

        if (!$this->isGranted('ROLE_ADMIN')) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
             throw $this->createAccessDeniedException('Only admins can restore inventories.');
        }

        if (!$inventory) {
            if (!$em->getFilters()->isEnabled('softdeleteable')) {
                $em->getFilters()->enable('softdeleteable');
            }
            throw $this->createNotFoundException();
        }

        $inventory->setDeletedAt(null);
        $em->flush();
        if (!$em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->enable('softdeleteable');
        }

        return $this->json(['message' => 'Inventory restored']);
    }

    #[Route('/{id}/permanent', name: 'app_inventory_permanent_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function permanentDelete(
        string $id, 
        InventoryRepository $repo, 
        EntityManagerInterface $em
    ): Response {
        if ($em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->disable('softdeleteable');
        }
        $inventory = $repo->find($id);

        if (!$this->isGranted('ROLE_ADMIN')) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
             throw $this->createAccessDeniedException('Only admins can permanently delete inventories.');
        }

        if (!$inventory) {
             if (!$em->getFilters()->isEnabled('softdeleteable')) {
                 $em->getFilters()->enable('softdeleteable');
             }
            throw $this->createNotFoundException();
        }

        // Hard delete using DQL to bypass listeners or standard behavior
        $em->createQuery('DELETE FROM App\Entity\Inventory i WHERE i.id = :id')
           ->setParameter('id', $inventory->getId()) // Use getId() specifically for UUID
           ->execute();

        if (!$em->getFilters()->isEnabled('softdeleteable')) {
            $em->getFilters()->enable('softdeleteable');
        }

        return $this->json(['message' => 'Permanently deleted']);
    }

    #[Route('/{id}/access', name: 'app_inventory_access_add', methods: ['POST'])]
    public function addAccess(
        Inventory $inventory, 
        Request $request, 
        UserRepository $userRepo, 
        EntityManagerInterface $em,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_MANAGE_ACCESS', $inventory);
        
        $data = json_decode($request->getContent(), true);
        $userId = $data['userId'] ?? null;
        
        if (!$userId) {
            return $this->json(['error' => 'User ID required'], 400);
        }

        $user = $userRepo->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if ($inventory->getCreator() === $user) {
            return $this->json(['error' => 'Cannot share with yourself'], 400);
        }

        $inventory->addSharedWith($user);
        $em->flush();

        // Log activity
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($inventory, $this->getUser(), 'collaborator_added', $isAdmin, [
            'addedUserId' => $user->getId()->toRfc4122(),
            'addedUserName' => $user->getName()
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);

        return $this->json(['message' => 'User access granted']);
    }

    #[Route('/{id}/access/{userId}', name: 'app_inventory_access_remove', methods: ['DELETE'])]
    public function removeAccess(
        Inventory $inventory, 
        string $userId, 
        UserRepository $userRepo, 
        EntityManagerInterface $em,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_MANAGE_ACCESS', $inventory);
        
        $user = $userRepo->find($userId);
        if (!$user) {
             return $this->json(['error' => 'User not found'], 404);
        }

        $inventory->removeSharedWith($user);
        $em->flush();

        // Log activity
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($inventory, $this->getUser(), 'collaborator_removed', $isAdmin, [
            'removedUserId' => $user->getId()->toRfc4122(),
            'removedUserName' => $user->getName()
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);

        return $this->json(['message' => 'User access removed']);
    }

    #[Route('/{id}/like', name: 'app_inventory_toggle_like', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function toggleLike(
        Inventory $inventory,
        EntityManagerInterface $em,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        /** @var User $user */
        $user = $this->getUser();
        
        $liked = $inventory->toggleLike($user);
        $em->flush();

        // Log activity only when liking (not unliking)
        if ($liked) {
            $isAdmin = $this->isGranted('ROLE_ADMIN');
            $activity = $activityRepo->logActivity($inventory, $user, 'like', $isAdmin);
            $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);
        }

        // Broadcast stats update
        $notifier->notifyInventoryStats($inventory->getId()->toRfc4122(), [
            'likes' => $inventory->getLikeCount(),
            'views' => $inventory->getViewCount()
        ]);

        return $this->json([
            'liked' => $liked,
            'likeCount' => $inventory->getLikeCount(),
        ]);
    }

    // =========================================
    // Activity & Permission Request Endpoints
    // =========================================

    #[Route('/{id}/activities', name: 'app_inventory_activities', methods: ['GET'])]
    public function getActivities(
        Inventory $inventory,
        Request $request,
        \App\Repository\ActivityRepository $activityRepo
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_VIEW', $inventory);
        
        /** @var User|null $user */
        $user = $this->getUser();
        
        // Determine if viewer is collaborator (owner, sharedWith, or admin)
        $isCollaborator = false;
        if ($user) {
            $isCollaborator = $inventory->getCreator() === $user
                           || $inventory->getSharedWith()->contains($user)
                           || $this->isGranted('ROLE_ADMIN');
        }
        
        $types = $request->query->all('types') ?: [];
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(50, max(10, (int)$request->query->get('limit', 20)));
        
        $result = $activityRepo->findByInventoryPaginated(
            $inventory, $isCollaborator, $types, $page, $limit
        );
        
        return $this->json([
            'activities' => array_map(fn($a) => [
                'id' => $a->getId()->toRfc4122(),
                'type' => $a->getType(),
                'user' => [
                    'id' => $a->getUser()->getId()->toRfc4122(),
                    'name' => $a->getUser()->getName(),
                    'avatarUrl' => $a->getUser()->getAvatarUrl()
                ],
                'isAdminAction' => $a->isAdminAction(),
                'metadata' => $a->getMetadata(),
                'createdAt' => $a->getCreatedAt()->format('c')
            ], $result['data']),
            'stats' => $activityRepo->getStats($inventory),
            'total' => $result['total'],
            'pages' => $result['pages'],
            'page' => $result['page']
        ]);
    }

    #[Route('/{id}/request-access', name: 'app_inventory_request_access', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function requestAccess(
        Inventory $inventory,
        Request $request,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        /** @var User $user */
        $user = $this->getUser();
        
        // Can't request if already has access
        if ($inventory->getCreator() === $user) {
            return $this->json(['error' => 'You are the owner'], 400);
        }
        if ($inventory->getSharedWith()->contains($user)) {
            return $this->json(['error' => 'Already have access'], 400);
        }
        
        // Check for existing pending request
        if ($activityRepo->hasPendingRequest($inventory, $user)) {
            return $this->json(['error' => 'Request already pending'], 400);
        }
        
        $data = json_decode($request->getContent(), true);
        $message = isset($data['message']) ? substr(trim($data['message']), 0, 200) : null;
        
        $activity = $activityRepo->logActivity($inventory, $user, 'permission_request', false, [
            'message' => $message
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);
        
        return $this->json(['message' => 'Request sent']);
    }

    #[Route('/{id}/access-requests', name: 'app_inventory_access_requests', methods: ['GET'])]
    public function getAccessRequests(
        Inventory $inventory,
        \App\Repository\ActivityRepository $activityRepo
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_MANAGE_ACCESS', $inventory);
        
        $requests = $activityRepo->getPendingRequests($inventory);
        
        return $this->json([
            'requests' => array_map(fn($a) => [
                'id' => $a->getId()->toRfc4122(),
                'user' => [
                    'id' => $a->getUser()->getId()->toRfc4122(),
                    'name' => $a->getUser()->getName(),
                    'email' => $a->getUser()->getEmail(),
                    'avatarUrl' => $a->getUser()->getAvatarUrl()
                ],
                'message' => $a->getMetadata()['message'] ?? null,
                'createdAt' => $a->getCreatedAt()->format('c')
            ], $requests)
        ]);
    }

    #[Route('/{id}/access-requests/{userId}/approve', name: 'app_inventory_approve_access', methods: ['POST'])]
    public function approveAccessRequest(
        Inventory $inventory,
        string $userId,
        UserRepository $userRepo,
        \App\Repository\ActivityRepository $activityRepo,
        EntityManagerInterface $em,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_MANAGE_ACCESS', $inventory);
        
        $requestUser = $userRepo->find($userId);
        if (!$requestUser) {
            throw $this->createNotFoundException('User not found');
        }
        
        // Add user to sharedWith
        $inventory->addSharedWith($requestUser);
        $em->flush();
        
        // Remove pending request
        $activityRepo->removePendingRequest($inventory, $requestUser);
        
        // Log approval
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($inventory, $this->getUser(), 'permission_granted', $isAdmin, [
            'grantedToId' => $userId,
            'grantedToName' => $requestUser->getName()
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);
        
        return $this->json(['message' => 'Access granted']);
    }

    #[Route('/{id}/access-requests/{userId}/deny', name: 'app_inventory_deny_access', methods: ['POST'])]
    public function denyAccessRequest(
        Inventory $inventory,
        string $userId,
        UserRepository $userRepo,
        \App\Repository\ActivityRepository $activityRepo,
        \App\Service\RealTimeNotifier $notifier
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_MANAGE_ACCESS', $inventory);
        
        $requestUser = $userRepo->find($userId);
        if (!$requestUser) {
            throw $this->createNotFoundException('User not found');
        }
        
        // Remove pending request
        $activityRepo->removePendingRequest($inventory, $requestUser);
        
        // Log denial
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $activity = $activityRepo->logActivity($inventory, $this->getUser(), 'permission_denied', $isAdmin, [
            'deniedToId' => $userId,
            'deniedToName' => $requestUser->getName() 
        ]);
        
        $notifier->notifyNewActivity($inventory->getId()->toRfc4122(), $activity);
        
        return $this->json(['message' => 'Request denied']);
    }

    #[Route('/{id}/stats', name: 'app_inventory_stats', methods: ['GET'])]
    public function getItemStats(
        Inventory $inventory,
        ItemRepository $itemRepo
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_VIEW', $inventory);

        $items = $inventory->getItems();
        $fields = $inventory->getFields();
        $totalItems = count($items);

        if ($totalItems === 0) {
            return $this->json([
                'totalItems' => 0,
                'numericStats' => [],
                'stringStats' => [],
                'completionRates' => []
            ]);
        }

        $numericStats = [];
        $stringStats = [];
        $completionRates = [];

        // Process each field
        foreach ($fields as $field) {
            if ($field->isHidden()) {
                continue;
            }

            $fieldId = $field->getId()->toRfc4122();
            $fieldType = $field->getType();
            $fieldLabel = $field->getLabel();

            $values = [];
            $nonNullCount = 0;

            // Collect values from all items
            foreach ($items as $item) {
                $val = $item->getFieldValue($field);
                if ($val !== null && $val !== '') {
                    $values[] = $val;
                    $nonNullCount++;
                }
            }

            // Calculate numeric stats
            if ($fieldType === 'number' && count($values) > 0) {
                $numericValues = array_map('floatval', $values);
                $numericStats[$fieldId] = [
                    'label' => $fieldLabel,
                    'min' => min($numericValues),
                    'max' => max($numericValues),
                    'avg' => round(array_sum($numericValues) / count($numericValues), 2),
                    'sum' => array_sum($numericValues),
                    'count' => count($numericValues)
                ];
            }

            // Calculate string stats (top 5 most frequent values)
            if (in_array($fieldType, ['string', 'text', 'select']) && count($values) > 0) {
                $valueCounts = array_count_values($values);
                arsort($valueCounts);
                $topValues = array_slice($valueCounts, 0, 5, true);
                
                $stringStats[$fieldId] = [
                    'label' => $fieldLabel,
                    'topValues' => array_map(function($val, $count) use ($totalItems) {
                        return [
                            'value' => $val,
                            'count' => $count,
                            'percentage' => round(($count / $totalItems) * 100)
                        ];
                    }, array_keys($topValues), array_values($topValues))
                ];
            }

            // Calculate completion rate for all visible fields
            $completionRates[$fieldId] = [
                'label' => $fieldLabel,
                'rate' => round(($nonNullCount / $totalItems) * 100)
            ];
        }

        return $this->json([
            'totalItems' => $totalItems,
            'numericStats' => $numericStats,
            'stringStats' => $stringStats,
            'completionRates' => $completionRates
        ]);
    }
}
