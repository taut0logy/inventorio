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
        $popularInventories = $inventoryRepository->findPopular(5);

        return $this->render('home/index.html.twig', [
            'categories' => $categories,
            'tags' => array_map(fn($row) => [
                'name' => $row[0]->getName(),
                'count' => (int) $row['inventoryCount'],
            ], $tags),
            'latestInventories' => array_map(fn($inv) => [
                'id' => $inv->getId()->toRfc4122(),
                'title' => $inv->getTitle(),
                'description' => mb_substr($inv->getDescription() ?? '', 0, 100),
                'category' => $inv->getCategory()?->getName(),
                'itemCount' => $inv->getItems()->count(),
                'createdAt' => $inv->getCreatedAt()->format('Y-m-d'),
            ], $latestInventories),
            'popularInventories' => array_map(fn($inv) => [
                'id' => $inv->getId()->toRfc4122(),
                'title' => $inv->getTitle(),
                'description' => mb_substr($inv->getDescription() ?? '', 0, 100),
                'category' => $inv->getCategory()?->getName(),
                'itemCount' => $inv->getItems()->count(),
                'viewCount' => $inv->getViewCount(),
                'likeCount' => $inv->getLikeCount(),
            ], $popularInventories),
        ]);
    }
}

