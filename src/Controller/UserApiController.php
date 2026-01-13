<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class UserApiController extends AbstractController
{
    #[Route('/search', name: 'app_api_users_search', methods: ['GET'])]
    public function search(Request $request, UserRepository $userRepository): JsonResponse
    {
        $query = $request->query->get('q', '');
        if (strlen($query) < 2) {
            return $this->json([]);
        }

        /** @var \App\Entity\User|null $currentUser */
        $currentUser = $this->getUser();
        
        if (!$currentUser) {
            return $this->json(['error' => 'Not authenticated'], 401);
        }

        $users = $userRepository->createQueryBuilder('u')
            ->where('u.email LIKE :query OR u.name LIKE :query')
            ->andWhere('u.id != :currentUserId')
            ->andWhere('u.deletedAt IS NULL')
            ->setParameter('query', '%'.$query.'%')
            ->setParameter('currentUserId', $currentUser->getId())
            ->setMaxResults(10)
            ->getQuery()
            ->getResult();

        $results = array_map(fn($user) => [
            'id' => $user->getId()->toRfc4122(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatarUrl' => $user->getAvatarUrl()
        ], $users);

        return $this->json($results);
    }
}
