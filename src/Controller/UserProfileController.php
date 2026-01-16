<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\ActivityRepository;
use App\Repository\InventoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UserProfileController extends AbstractController
{
    public function __construct(
        private InventoryRepository $inventoryRepository,
        private ActivityRepository $activityRepository,
    ) {}

    #[Route('/user/{id}', name: 'app_user_profile')]
    public function show(User $profileUser, Request $request): Response
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        $isOwner = $currentUser && $currentUser->getId()->equals($profileUser->getId());
        $isAdmin = $currentUser && in_array('ROLE_ADMIN', $currentUser->getRoles());
        
        // Determine what the viewer can see
        $canSeePrivate = $isOwner || $isAdmin;
        $canSeeDeleted = $isAdmin;
        
        // Get filter params (only allowed for owners/admins)
        $visibility = 'public';
        $showDeleted = false;
        
        if ($canSeePrivate) {
            $visibility = $request->query->get('visibility', 'all');
            if (!in_array($visibility, ['public', 'private', 'all'])) {
                $visibility = 'all';
            }
        }
        
        if ($canSeeDeleted) {
            $showDeleted = $request->query->getBoolean('deleted', false);
        }
        
        // Get stats - public only for visitors, all for owner/admin
        $statsPublicOnly = !$canSeePrivate;
        $stats = $this->inventoryRepository->getStatsForCreator($profileUser, $statsPublicOnly);
        
        // Get inventories with filters
        $inventoryResults = $this->inventoryRepository->findByCreatorWithFilters(
            $profileUser,
            $canSeePrivate ? $visibility : 'public',
            $canSeeDeleted ? $showDeleted : false
        );
        
        // Format inventories for React
        $inventories = array_map(fn($row) => [
            'id' => $row[0]->getId()->toRfc4122(),
            'title' => $row[0]->getTitle(),
            'description' => mb_substr($row[0]->getDescription() ?? '', 0, 100),
            'imageUrl' => $row[0]->getImageUrl(),
            'isPublic' => $row[0]->isPublic(),
            'isDeleted' => $row[0]->getDeletedAt() !== null,
            'category' => [
                'name' => $row[0]->getCategory()?->getName(),
                'icon' => $row[0]->getCategory()?->getIconUrl(),
            ],
            'itemCount' => (int) $row['itemCount'],
            'likeCount' => (int) $row['likeCount'],
            'viewCount' => $row[0]->getViewCount(),
            'createdAt' => $row[0]->getCreatedAt()->format('Y-m-d'),
        ], $inventoryResults);
        
        return $this->render('user/profile.html.twig', [
            'profileUser' => $profileUser,
            'inventories' => $inventories,
            'stats' => $stats,
            'isOwner' => $isOwner,
            'isAdmin' => $isAdmin,
            'canSeePrivate' => $canSeePrivate,
            'canSeeDeleted' => $canSeeDeleted,
            'visibility' => $visibility,
            'showDeleted' => $showDeleted,
        ]);
    }

    #[Route('/user/{id}/activities', name: 'app_user_activities', methods: ['GET'])]
    public function getActivities(User $profileUser, Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        $isOwner = $currentUser && $currentUser->getId()->equals($profileUser->getId());
        $isAdmin = $currentUser && in_array('ROLE_ADMIN', $currentUser->getRoles());
        
        // Owner and admin can see access-related events
        $canSeeAccessEvents = $isOwner || $isAdmin;
        
        $types = $request->query->all('types') ?: [];
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(50, max(10, (int)$request->query->get('limit', 20)));
        
        $result = $this->activityRepository->findByUserPaginated(
            $profileUser, $canSeeAccessEvents, $types, $page, $limit
        );
        
        return $this->json([
            'activities' => array_map(fn($a) => [
                'id' => $a->getId()->toRfc4122(),
                'type' => $a->getType(),
                'user' => [
                    'id' => $a->getUser()->getId()->toRfc4122(),
                    'name' => $a->getUser()->getName(),
                    'avatarUrl' => $a->getUser()->getAvatarUrl()
                ],
                'inventory' => [
                    'id' => $a->getInventory()->getId()->toRfc4122(),
                    'title' => $a->getInventory()->getTitle(),
                ],
                'isAdminAction' => $a->isAdminAction(),
                'metadata' => $a->getMetadata(),
                'createdAt' => $a->getCreatedAt()->format('c')
            ], $result['data']),
            'stats' => $this->activityRepository->getStatsForUser($profileUser),
            'total' => $result['total'],
            'pages' => $result['pages'],
            'page' => $result['page']
        ]);
    }
}
