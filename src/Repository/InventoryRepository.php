<?php

namespace App\Repository;

use App\Entity\Inventory;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Inventory>
 *
 * @method Inventory|null find($id, $lockMode = null, $lockVersion = null)
 * @method Inventory|null findOneBy(array $criteria, array $orderBy = null)
 * @method Inventory[]    findAll()
 * @method Inventory[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InventoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Inventory::class);
    }

    /**
     * Full-text search across inventories
     * Searches title and description using PostgreSQL ILIKE for simplicity
     * Returns public inventories OR inventories owned by the user
     * Uses subquery to avoid N+1 for item counts
     * Supports pagination via offset
     */
    public function searchFullText(string $query = '', ?User $user = null, int $limit = 10, ?string $category = null, int $offset = 0): array
    {
        $qb = $this->createQueryBuilder('i')
            ->addSelect('(SELECT COUNT(item.id) FROM App\Entity\Item item WHERE item.inventory = i AND item.deletedAt IS NULL) AS itemCount')
            ->leftJoin('i.creator', 'u')
            ->leftJoin('i.category', 'c')
            ->leftJoin('i.tags', 't')
            ->where('i.deletedAt IS NULL');

        // Search condition - use ILIKE for case-insensitive partial match
        if (!empty($query)) {
            $searchCondition = $qb->expr()->orX(
                $qb->expr()->like('LOWER(i.title)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.description)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(t.name)', 'LOWER(:query)')
            );
            $qb->andWhere($searchCondition)
               ->setParameter('query', '%' . $query . '%');
        }

        // Category filter
        if ($category) {
            $qb->andWhere('c.name = :category')
               ->setParameter('category', $category);
        }

        // Visibility: public OR owned by user
        if ($user) {
            $visibilityCondition = $qb->expr()->orX(
                $qb->expr()->eq('i.isPublic', ':true'),
                $qb->expr()->eq('i.creator', ':user')
            );
            $qb->andWhere($visibilityCondition)
               ->setParameter('true', true)
               ->setParameter('user', $user);
        } else {
            $qb->andWhere('i.isPublic = :true')
               ->setParameter('true', true);
        }

        $qb->groupBy('i.id')
           ->orderBy('i.createdAt', 'DESC')
           ->setFirstResult($offset)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Find inventories shared with the user
     */
    public function findSharedWithUser(User $user): array
    {
        return $this->createQueryBuilder('i')
            ->innerJoin('i.sharedWith', 'u')
            ->where('u.id = :userId')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('userId', $user->getId())
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find inventories by user (for My Inventories page)
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.creator = :user')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find public inventories for homepage (latest)
     * Uses subquery to avoid N+1 for item counts
     */
    public function findLatestPublic(int $limit = 10): array
    {
        return $this->createQueryBuilder('i')
            ->addSelect('(SELECT COUNT(item.id) FROM App\Entity\Item item WHERE item.inventory = i AND item.deletedAt IS NULL) AS itemCount')
            ->andWhere('i.isPublic = :true')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('true', true)
            ->orderBy('i.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find popular inventories
     * Uses subquery to avoid N+1 for item counts
     */
    public function findPopular(int $limit = 5): array
    {
        return $this->createQueryBuilder('i')
            ->leftJoin('i.likedBy', 'likes')
            ->addSelect('COUNT(likes.id) as HIDDEN likeCount')
            ->addSelect('(SELECT COUNT(item.id) FROM App\Entity\Item item WHERE item.inventory = i AND item.deletedAt IS NULL) AS itemCount')
            ->andWhere('i.isPublic = :true')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('true', true)
            ->groupBy('i.id')
            ->orderBy('(COUNT(likes.id) * 3) + i.viewCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find inventories by creator with visibility and deleted filters
     * For public profile page
     * 
     * @param string $visibility 'public', 'private', 'all'
     * @param bool $includeDeleted Only admins can set this to true
     */
    public function findByCreatorWithFilters(
        User $creator, 
        string $visibility = 'public', 
        bool $includeDeleted = false
    ): array {
        $qb = $this->createQueryBuilder('i')
            ->addSelect('(SELECT COUNT(item.id) FROM App\Entity\Item item WHERE item.inventory = i AND item.deletedAt IS NULL) AS itemCount')
            ->leftJoin('i.likedBy', 'likes')
            ->addSelect('COUNT(likes.id) as likeCount')
            ->andWhere('i.creator = :creator')
            ->setParameter('creator', $creator)
            ->groupBy('i.id')
            ->orderBy('i.createdAt', 'DESC');

        // Visibility filter
        if ($visibility === 'public') {
            $qb->andWhere('i.isPublic = :true')
               ->setParameter('true', true);
        } elseif ($visibility === 'private') {
            $qb->andWhere('i.isPublic = :false')
               ->setParameter('false', false);
        }
        // 'all' means no visibility filter

        // Deleted filter
        if (!$includeDeleted) {
            $qb->andWhere('i.deletedAt IS NULL');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Get aggregate stats for a user's inventories
     */
    public function getStatsForCreator(User $creator, bool $publicOnly = true): array
    {
        $qb = $this->getEntityManager()->createQueryBuilder()
            ->select('COUNT(DISTINCT i.id) as inventoryCount')
            ->addSelect('COALESCE(SUM(i.viewCount), 0) as totalViews')
            ->from(Inventory::class, 'i')
            ->where('i.creator = :creator')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('creator', $creator);

        if ($publicOnly) {
            $qb->andWhere('i.isPublic = :true')
               ->setParameter('true', true);
        }

        $stats = $qb->getQuery()->getSingleResult();

        // Get total likes separately (needs join)
        $likesQb = $this->getEntityManager()->createQueryBuilder()
            ->select('COUNT(likes.id) as totalLikes')
            ->from(Inventory::class, 'i')
            ->leftJoin('i.likedBy', 'likes')
            ->where('i.creator = :creator')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('creator', $creator);

        if ($publicOnly) {
            $likesQb->andWhere('i.isPublic = :true')
                    ->setParameter('true', true);
        }

        $likesResult = $likesQb->getQuery()->getSingleResult();

        // Get total items count
        $itemsQb = $this->getEntityManager()->createQueryBuilder()
            ->select('COUNT(item.id) as totalItems')
            ->from('App\Entity\Item', 'item')
            ->join('item.inventory', 'i')
            ->where('i.creator = :creator')
            ->andWhere('i.deletedAt IS NULL')
            ->andWhere('item.deletedAt IS NULL')
            ->setParameter('creator', $creator);

        if ($publicOnly) {
            $itemsQb->andWhere('i.isPublic = :true')
                    ->setParameter('true', true);
        }

        $itemsResult = $itemsQb->getQuery()->getSingleResult();

        return [
            'inventoryCount' => (int) $stats['inventoryCount'],
            'totalViews' => (int) $stats['totalViews'],
            'totalLikes' => (int) $likesResult['totalLikes'],
            'totalItems' => (int) $itemsResult['totalItems'],
        ];
    }
}
