<?php

namespace App\Controller;

use App\Repository\CategoryRepository;
use App\Repository\TagRepository;
use App\Repository\InventoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository,
        InventoryRepository $inventoryRepository
    ): Response {
        $categories = $categoryRepository->findAllOrdered();
        $tags = $tagRepository->findPopular(30);
        $latestInventories = $inventoryRepository->findLatestPublic(6);

        return $this->render('home/index.html.twig', [
            'categories' => $categories,
            'tags' => array_map(fn($tag) => ['name' => $tag->getName()], $tags),
            'latestInventories' => array_map(fn($inv) => [
                'title' => $inv->getTitle(),
                'category' => $inv->getCategory()?->getName(),
                'itemCount' => $inv->getItems()->count(),
                'createdAt' => $inv->getCreatedAt()->format('Y-m-d'),
            ], $latestInventories),
            'popularInventories' => [], // TODO: Implement view counts
        ]);
    }
}
