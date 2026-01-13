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
             // Re-enable filter for safety if this EM is reused, 
             // though in Symfony request scope it usually dies.
             // But good practice.
             // Re-enable filter for safety
             if (!$entityManager->getFilters()->isEnabled('softdeleteable')) {
                 $entityManager->getFilters()->enable('softdeleteable');
             }
             
             // Filter in memory to only return actually deleted ones?
             // findBy will return ALL (including deleted).
             // The user might want ONLY deleted items in Trash UI.
             // If I disable filter, I get both.
             // I should filter `u.deletedAt IS NOT NULL`.
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
        EntityManagerInterface $entityManager
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);

        $data = json_decode($request->getContent(), true);
        
        if (isset($data['customFieldsConfig'])) {
            $inventory->setCustomFieldsConfig($data['customFieldsConfig']);
        }

        if (isset($data['idGenerationConfig'])) {
            $inventory->setIdGenerationConfig($data['idGenerationConfig']);
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\ORM\OptimisticLockException $e) {
            return $this->json(['error' => 'Conflict detected. The settings have been modified by another user.'], 409);
        }

        return $this->json([
            'message' => 'Settings updated successfully',
            'version' => $inventory->getVersion()
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
    public function show(Inventory $inventory, Request $request, EntityManagerInterface $em, ItemRepository $itemRepo): Response
    {
        $this->denyAccessUnlessGranted('INVENTORY_VIEW', $inventory);
        
        $sessionKey = 'viewed_inventory_' . $inventory->getId()->toRfc4122();
        if (!$request->getSession()->has($sessionKey)) {
            $inventory->incrementViewCount();
            $em->flush();
            $request->getSession()->set($sessionKey, true);
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

        return $this->render('inventory/show.html.twig', [
            'inventory' => $inventory,
            'isCreator' => $this->getUser() === $inventory->getCreator(),
            'canAddItem' => $this->isGranted('ITEM_ADD', $inventory),
            'canEditInventory' => $this->isGranted('INVENTORY_EDIT', $inventory),
            'showDeleted' => $showDeleted,
            'deletedItems' => $showDeleted ? $items : [],
            'likedItemIds' => $this->getUser() ? $itemRepo->findLikedItemIds($inventory, $this->getUser()) : [],
            'inventoryLiked' => $inventory->isLikedByUser($this->getUser()),
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

        if (!$inventory || $inventory->getCreator() !== $this->getUser()) {
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

        if (!$inventory || $inventory->getCreator() !== $this->getUser()) {
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
        EntityManagerInterface $em
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);
        
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

        return $this->json(['message' => 'User access granted']);
    }

    #[Route('/{id}/access/{userId}', name: 'app_inventory_access_remove', methods: ['DELETE'])]
    public function removeAccess(
        Inventory $inventory, 
        string $userId, 
        UserRepository $userRepo, 
        EntityManagerInterface $em
    ): Response {
        $this->denyAccessUnlessGranted('INVENTORY_EDIT', $inventory);
        
        $user = $userRepo->find($userId);
        if (!$user) {
             return $this->json(['error' => 'User not found'], 404);
        }

        $inventory->removeSharedWith($user);
        $em->flush();

        return $this->json(['message' => 'User access removed']);
    }

    #[Route('/{id}/like', name: 'app_inventory_toggle_like', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function toggleLike(
        Inventory $inventory,
        EntityManagerInterface $em
    ): Response {
        /** @var User $user */
        $user = $this->getUser();
        
        $liked = $inventory->toggleLike($user);
        $em->flush();

        return $this->json([
            'liked' => $liked,
            'likeCount' => $inventory->getLikeCount(),
        ]);
    }
}

