<?php

namespace App\Controller;

use App\Repository\TagRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/tags')]
class TagController extends AbstractController
{
    public function __construct(private TagRepository $tagRepository) {}

    #[Route('/autocomplete', name: 'api_tags_autocomplete', methods: ['GET'])]
    public function autocomplete(Request $request): JsonResponse
    {
        $query = $request->query->get('query', '');
        if (trim($query) === '') {
            return $this->json([]);
        }

        $tags = $this->tagRepository->searchByName($query);

        return $this->json(array_map(fn($t) => [
            'id' => $t->getId()->toRfc4122(),
            'name' => $t->getName()
        ], $tags));
    }

    #[Route('/popular', name: 'api_tags_popular', methods: ['GET'])]
    public function popular(): JsonResponse
    {
        $tags = $this->tagRepository->findPopular(20);

        return $this->json(array_map(fn($t) => [
            'id' => $t->getId()->toRfc4122(),
            'name' => $t->getName()
        ], $tags));
    }
}
