<?php

namespace App\Repository;

use App\Entity\Activity;
use App\Entity\Inventory;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Activity>
 */
class ActivityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Activity::class);
    }

    /**
     * Log a new activity
     */
    public function logActivity(
        Inventory $inventory,
        User $user,
        string $type,
        bool $isAdmin = false,
        ?array $metadata = null
    ): Activity {
        $activity = new Activity();
        $activity->setInventory($inventory);
        $activity->setUser($user);
        $activity->setType($type);
        $activity->setIsAdminAction($isAdmin);
        $activity->setMetadata($metadata);

        $this->getEntityManager()->persist($activity);
        $this->getEntityManager()->flush();

        return $activity;
    }

    /**
     * Find activities with pagination and type filtering
     * Access-related events are hidden from non-collaborators
     */
    public function findByInventoryPaginated(
        Inventory $inventory,
        bool $isCollaborator,
        array $types = [],
        int $page = 1,
        int $limit = 20
    ): array {
        $qb = $this->createQueryBuilder('a')
            ->where('a.inventory = :inv')
            ->setParameter('inv', $inventory)
            ->orderBy('a.createdAt', 'DESC');

        if (!$isCollaborator) {
            $qb->andWhere('a.type NOT IN (:accessTypes)')
               ->setParameter('accessTypes', [
                   'permission_request',
                   'permission_granted',
                   'permission_denied',
                   'collaborator_added',
                   'collaborator_removed'
               ]);
        }

        if (!empty($types)) {
            $qb->andWhere('a.type IN (:types)')
               ->setParameter('types', $types);
        }

        $countQb = clone $qb;
        $countQb->resetDQLPart('orderBy');
        $total = (int) $countQb->select('COUNT(a.id)')->getQuery()->getSingleScalarResult();

        $activities = $qb->setFirstResult(($page - 1) * $limit)
                         ->setMaxResults($limit)
                         ->getQuery()
                         ->getResult();

        return [
            'data' => $activities,
            'total' => $total,
            'pages' => (int) ceil($total / $limit),
            'page' => $page
        ];
    }

    /**
     * Get aggregated stats per activity type
     */
    public function getStats(Inventory $inventory): array
    {
        $qb = $this->createQueryBuilder('a')
            ->select('a.type, COUNT(a.id) as count')
            ->where('a.inventory = :inv')
            ->setParameter('inv', $inventory)
            ->groupBy('a.type');

        $results = $qb->getQuery()->getResult();

        $stats = [];
        foreach ($results as $row) {
            $stats[$row['type']] = (int) $row['count'];
        }

        return $stats;
    }

    /**
     * Check if user has a pending permission request
     */
    public function hasPendingRequest(Inventory $inventory, User $user): bool
    {
        $count = $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.inventory = :inv')
            ->andWhere('a.user = :user')
            ->andWhere('a.type = :type')
            ->setParameter('inv', $inventory)
            ->setParameter('user', $user)
            ->setParameter('type', 'permission_request')
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    /**
     * Get pending access requests for an inventory
     */
    public function getPendingRequests(Inventory $inventory): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.inventory = :inv')
            ->andWhere('a.type = :type')
            ->setParameter('inv', $inventory)
            ->setParameter('type', 'permission_request')
            ->orderBy('a.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Remove pending request (after approve/deny)
     */
    public function removePendingRequest(Inventory $inventory, User $user): void
    {
        $this->createQueryBuilder('a')
            ->delete()
            ->where('a.inventory = :inv')
            ->andWhere('a.user = :user')
            ->andWhere('a.type = :type')
            ->setParameter('inv', $inventory)
            ->setParameter('user', $user)
            ->setParameter('type', 'permission_request')
            ->getQuery()
            ->execute();
    }

    /**
     * Find activities for a user across all their inventories with pagination
     * Access-related events hidden unless viewer is owner/admin
     */
    public function findByUserPaginated(
        User $user,
        bool $accessEvent,
        array $types = [],
        int $page = 1,
        int $limit = 20
    ): array {
        $qb = $this->createQueryBuilder('a')
            ->where('a.user = :user')
            ->setParameter('user', $user)
            ->orderBy('a.createdAt', 'DESC');

        if (!$accessEvent) {
            $qb->andWhere('a.type NOT IN (:accessTypes)')
               ->setParameter('accessTypes', [
                   'permission_request',
                   'permission_granted',
                   'permission_denied',
                   'collaborator_added',
                   'collaborator_removed'
               ]);
        }

        if (!empty($types)) {
            $qb->andWhere('a.type IN (:types)')
               ->setParameter('types', $types);
        }

        $countQb = clone $qb;
        $countQb->resetDQLPart('orderBy');
        $total = (int) $countQb->select('COUNT(a.id)')->getQuery()->getSingleScalarResult();

        $activities = $qb->setFirstResult(($page - 1) * $limit)
                         ->setMaxResults($limit)
                         ->getQuery()
                         ->getResult();

        return [
            'data' => $activities,
            'total' => $total,
            'pages' => (int) ceil($total / $limit),
            'page' => $page
        ];
    }

    /**
     * Get aggregated stats per activity type for a user
     */
    public function getStatsForUser(User $user): array
    {
        $qb = $this->createQueryBuilder('a')
            ->select('a.type, COUNT(a.id) as count')
            ->where('a.user = :user')
            ->setParameter('user', $user)
            ->groupBy('a.type');

        $results = $qb->getQuery()->getResult();

        $stats = [];
        foreach ($results as $row) {
            $stats[$row['type']] = (int) $row['count'];
        }

        return $stats;
    }
}
