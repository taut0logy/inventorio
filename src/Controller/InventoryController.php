<?php

namespace App\Controller;

use App\Entity\Inventory;
use App\Repository\InventoryRepository;
use App\Repository\CategoryRepository;
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
        InventoryRepository $inventoryRepository,
        CategoryRepository $categoryRepository
    ): Response {
        return $this->render('inventory/index.html.twig', [
            'inventories' => $inventoryRepository->findBy(['creator' => $this->getUser()], ['createdAt' => 'DESC']),
            'categories' => $categoryRepository->findAllOrdered(),
        ]);
    }

    #[Route('/new', name: 'app_inventory_new', methods: ['GET', 'POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function new(
        Request $request, 
        EntityManagerInterface $entityManager, 
        CategoryRepository $categoryRepository
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

    #[Route('/batch-delete', name: 'app_inventory_batch_delete', methods: ['POST'])]
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

    #[Route('/{id}', name: 'app_inventory_show', methods: ['GET'])]
    public function show(Inventory $inventory): Response
    {
        return $this->render('inventory/show.html.twig', [
            'inventory' => $inventory,
            'isCreator' => $this->getUser() === $inventory->getCreator(),
        ]);
    }
}
