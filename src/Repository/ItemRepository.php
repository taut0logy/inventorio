<?php

namespace App\Repository;

use App\Entity\Item;
use App\Entity\Inventory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Item>
 */
class ItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Item::class);
    }

    /**
     * Find items by inventory (non-deleted)
     */
    public function findByInventory(Inventory $inventory): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.inventory = :inventory')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('inventory', $inventory)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Full-text search across items
     * Searches custom_id and all string/text fields
     * Can be scoped to a specific inventory or search globally (public inventories only)
     * Supports category filtering (by inventory category) and pagination
     */
    public function searchFullText(string $query = '', ?Inventory $inventory = null, int $limit = 10, int $offset = 0, ?string $category = null, ?\App\Entity\User $user = null): array
    {
        $qb = $this->createQueryBuilder('i')
            ->leftJoin('i.inventory', 'inv')
            ->leftJoin('inv.category', 'c')
            ->leftJoin('i.tags', 't')
            ->where('i.deletedAt IS NULL')
            ->andWhere('inv.deletedAt IS NULL');

        // Search across multiple fields (only if query is provided)
        if (!empty($query)) {
            $searchCondition = $qb->expr()->orX(
                $qb->expr()->like('LOWER(i.customId)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customString1Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customString2Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customString3Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customText1Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customText2Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(i.customText3Value)', 'LOWER(:query)'),
                $qb->expr()->like('LOWER(t.name)', 'LOWER(:query)')
            );
            $qb->andWhere($searchCondition)
               ->setParameter('query', '%' . $query . '%');
        }

        if ($inventory) {
            // Scoped to specific inventory
            $qb->andWhere('i.inventory = :inventory')
               ->setParameter('inventory', $inventory);
        } else {
            // Global search
            if ($user) {
                // Public OR Owned OR Shared
                $qb->leftJoin('inv.sharedWith', 'sw');
                $visibilityCondition = $qb->expr()->orX(
                    $qb->expr()->eq('inv.isPublic', ':true'),
                    $qb->expr()->eq('inv.creator', ':user'),
                    $qb->expr()->eq('sw', ':user')
                );
                $qb->andWhere($visibilityCondition)
                   ->setParameter('true', true)
                   ->setParameter('user', $user);
            } else {
                // Public only (anonymous)
                $qb->andWhere('inv.isPublic = :true')
                   ->setParameter('true', true);
            }
        }

        // Category filter (by inventory's category)
        if ($category) {
            $qb->andWhere('c.name = :category')
               ->setParameter('category', $category);
        }

        $qb->groupBy('i.id')
           ->orderBy('i.createdAt', 'DESC')
           ->setFirstResult($offset)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Find all items including soft-deleted (for admin)
     */
    public function findByInventoryIncludeDeleted(Inventory $inventory): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.inventory = :inventory')
            ->setParameter('inventory', $inventory)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get next sequence number for inventory
     */
    public function getNextSequenceNumber(Inventory $inventory): int
    {
        $result = $this->createQueryBuilder('i')
            ->select('MAX(i.sequenceNumber)')
            ->andWhere('i.inventory = :inventory')
            ->setParameter('inventory', $inventory)
            ->getQuery()
            ->getSingleScalarResult();

        return ($result ?? 0) + 1;
    }

    /**
     * Check if custom_id exists in inventory
     */
    public function customIdExists(Inventory $inventory, string $customId, ?string $excludeItemId = null): bool
    {
        $qb = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.inventory = :inventory')
            ->andWhere('i.customId = :customId')
            ->setParameter('inventory', $inventory)
            ->setParameter('customId', $customId);

        if ($excludeItemId) {
            $qb->andWhere('i.id != :excludeId')
               ->setParameter('excludeId', $excludeItemId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * Update with optimistic lock check
     */
    public function updateWithLock(Item $item, int $expectedVersion): bool
    {
        $affected = $this->createQueryBuilder('i')
            ->update()
            ->set('i.version', 'i.version + 1')
            ->set('i.updatedAt', ':now')
            ->where('i.id = :id')
            ->andWhere('i.version = :version')
            ->setParameter('id', $item->getId())
            ->setParameter('version', $expectedVersion)
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->execute();

        return $affected > 0;
    }

    public function save(Item $item, bool $flush = false): void
    {
        $this->getEntityManager()->persist($item);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Item $item, bool $flush = false): void
    {
        $this->getEntityManager()->remove($item);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    /**
     * Get IDs of items liked by user in this inventory
     * @return string[]
     */
    public function findLikedItemIds(Inventory $inventory, \App\Entity\User $user): array
    {
        $rows = $this->createQueryBuilder('i')
            ->select('i.id')
            ->join('i.likedBy', 'u')
            ->where('i.inventory = :inventory')
            ->andWhere('u.id = :user')
            ->setParameter('inventory', $inventory)
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_column($rows, 'id');
    }
}
