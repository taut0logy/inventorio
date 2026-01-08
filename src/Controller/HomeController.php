<?php

namespace App\Controller;

use App\Repository\CategoryRepository;
use App\Repository\TagRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository,
    ): Response {
        $categories = $categoryRepository->findAllOrdered();
        $tags = $tagRepository->findPopular(30);

        return $this->render('home/index.html.twig', [
            'categories' => $categories,
            'tags' => $tags,
            // Latest inventories will be added when Inventory entity is created
            'latestInventories' => [],
            'popularInventories' => [],
        ]);
    }
}
