<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class SearchPageController extends AbstractController
{
    #[Route('/search', name: 'app_search_page', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $query = trim($request->query->get('q', ''));
        
        return $this->render('search/index.html.twig', [
            'initialQuery' => $query,
        ]);
    }
}
