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
            'latestInventories' => array_map(fn($row) => [
                'id' => $row[0]->getId()->toRfc4122(),
                'title' => $row[0]->getTitle(),
                'description' => mb_substr($row[0]->getDescription() ?? '', 0, 100),
                'category' => $row[0]->getCategory()?->getName(),
                'itemCount' => (int) $row['itemCount'],
                'createdAt' => $row[0]->getCreatedAt()->format('Y-m-d'),
            ], $latestInventories),
            'popularInventories' => array_map(fn($row) => [
                'id' => $row[0]->getId()->toRfc4122(),
                'title' => $row[0]->getTitle(),
                'description' => mb_substr($row[0]->getDescription() ?? '', 0, 100),
                'category' => $row[0]->getCategory()?->getName(),
                'itemCount' => (int) $row['itemCount'],
                'viewCount' => $row[0]->getViewCount(),
                'likeCount' => $row[0]->getLikeCount(),
            ], $popularInventories),
        ]);
    }
}

