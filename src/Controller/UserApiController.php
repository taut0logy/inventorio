<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class UserApiController extends AbstractController
{
    #[Route('/search', name: 'app_api_users_search', methods: ['GET'])]
    public function search(Request $request, UserRepository $userRepository): Response
    {
        $query = $request->query->get('q', '');
        if (strlen($query) < 2) {
            return $this->json([]);
        }

        // Needs a repository method to search by name/email excluding current user
        // Assuming findBySearchQuery exists or I'll use createQueryBuilder here for speed.
        
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        $users = $userRepository->createQueryBuilder('u')
            ->where('u.email LIKE :query OR u.name LIKE :query')
            ->andWhere('u.id != :currentUserId')
            ->setParameter('query', '%'.$query.'%')
            ->setParameter('currentUserId', $currentUser->getId())
            ->setMaxResults(10)
            ->getQuery()
            ->getResult();

        $results = array_map(fn($user) => [
            'id' => $user->getId()->toRfc4122(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatarUrl()
        ], $users);

        return $this->json($results);
    }
}
