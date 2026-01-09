<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/users')]
#[IsGranted('ROLE_ADMIN')]
class AdminApiController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(50, (int) $request->query->get('limit', 10)));
        $search = trim($request->query->get('q', ''));
        $sort = $request->query->get('sort', 'createdAt');
        $dir = $request->query->get('dir', 'DESC');

        // Create query builder
        $qb = $this->userRepository->createQueryBuilder('u')
            ->where('u.deletedAt IS NULL');

        if ($search) {
            $qb->andWhere('LOWER(u.name) LIKE LOWER(:search) OR LOWER(u.email) LIKE LOWER(:search)')
               ->setParameter('search', "%$search%");
        }

        // Count total
        $countQb = clone $qb;
        $total = $countQb->select('COUNT(u.id)')->getQuery()->getSingleScalarResult();

        // Sorting
        $allowedSorts = ['name', 'email', 'createdAt', 'isBlocked'];
        if (in_array($sort, $allowedSorts)) {
            $qb->orderBy('u.' . $sort, strtoupper($dir) === 'ASC' ? 'ASC' : 'DESC');
        } else {
            $qb->orderBy('u.createdAt', 'DESC');
        }

        // Pagination
        $users = $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return $this->json([
            'data' => array_map(fn(User $user) => [
                'id' => $user->getId()->toRfc4122(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'avatarUrl' => $user->getAvatarUrl(),
                'roles' => $user->getRoles(),
                'isBlocked' => $user->isBlocked(),
                'createdAt' => $user->getCreatedAt()->format('c'),
            ], $users),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit),
            ]
        ]);
    }

    #[Route('/{id}/block', name: 'api_admin_users_block', methods: ['POST'])]
    public function toggleBlock(User $user): JsonResponse
    {
        // Prevent blocking self
        if ($user === $this->getUser()) {
             return $this->json(['message' => 'You cannot block yourself'], 403);
        }

        $user->setBlocked(!$user->isBlocked());
        $this->entityManager->flush();

        return $this->json([
            'message' => $user->isBlocked() ? 'User blocked' : 'User unblocked',
            'isBlocked' => $user->isBlocked()
        ]);
    }

    #[Route('/{id}/role', name: 'api_admin_users_role', methods: ['POST'])]
    public function toggleAdmin(User $user): JsonResponse
    {
        $roles = $user->getRoles();
        $isAdmin = in_array('ROLE_ADMIN', $roles);

        if ($isAdmin) {
            // Remove ROLE_ADMIN
            $roles = array_diff($roles, ['ROLE_ADMIN']);
            $message = 'Admin role removed';
        } else {
            // Add ROLE_ADMIN
            if (!in_array('ROLE_ADMIN', $roles)) {
                $roles[] = 'ROLE_ADMIN';
            }
            $message = 'Admin role added';
        }

        $user->setRoles(array_values($roles));
        $this->entityManager->flush();

        return $this->json([
            'message' => $message,
            'roles' => $user->getRoles()
        ]);
    }

    #[Route('/{id}', name: 'api_admin_users_delete', methods: ['DELETE'])]
    public function delete(User $user): JsonResponse
    {
        // Prevent deleting self
        if ($user === $this->getUser()) {
            return $this->json(['message' => 'You cannot delete yourself'], 403);
        }

        $user->setDeletedAt(new \DateTime());
        $this->entityManager->flush();

        return $this->json(['message' => 'User deleted successfully']);
    }

    #[Route('/bulk/block', name: 'api_admin_users_bulk_block', methods: ['POST'])]
    public function bulkBlock(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];
        
        if (empty($ids)) {
            return $this->json(['message' => 'No users selected'], 400);
        }

        $count = 0;
        foreach ($ids as $id) {
            $user = $this->userRepository->find($id);
            if ($user && $user !== $this->getUser()) {
                $user->setBlocked(true);
                $count++;
            }
        }
        
        $this->entityManager->flush();

        return $this->json(['message' => "$count users blocked"]);
    }

    #[Route('/bulk/unblock', name: 'api_admin_users_bulk_unblock', methods: ['POST'])]
    public function bulkUnblock(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];
        
        if (empty($ids)) {
            return $this->json(['message' => 'No users selected'], 400);
        }

        $count = 0;
        foreach ($ids as $id) {
            $user = $this->userRepository->find($id);
            if ($user) {
                $user->setBlocked(false);
                $count++;
            }
        }
        
        $this->entityManager->flush();

        return $this->json(['message' => "$count users unblocked"]);
    }

    #[Route('/bulk/delete', name: 'api_admin_users_bulk_delete', methods: ['POST'])]
    public function bulkDelete(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];
        
        if (empty($ids)) {
            return $this->json(['message' => 'No users selected'], 400);
        }

        $count = 0;
        foreach ($ids as $id) {
            $user = $this->userRepository->find($id);
            if ($user && $user !== $this->getUser()) {
                $user->setDeletedAt(new \DateTime());
                $count++;
            }
        }
        
        $this->entityManager->flush();

        return $this->json(['message' => "$count users deleted"]);
    }
}
