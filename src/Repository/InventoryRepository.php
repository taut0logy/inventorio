<?php

namespace App\Repository;

use App\Entity\Inventory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Inventory>
 */
class InventoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Inventory::class);
    }

    /**
     * Find public inventories ordered by creation date
     */
    public function findPublicLatest(int $limit = 10): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.isPublic = :public')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('public', true)
            ->orderBy('i.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find most popular (by view count)
     */
    public function findPopular(int $limit = 5): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.isPublic = :public')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('public', true)
            ->orderBy('i.viewCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find inventories by creator
     */
    public function findByCreator($user): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.creator = :creator')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('creator', $user)
            ->orderBy('i.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find inventories by category
     */
    public function findByCategory($category): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.category = :category')
            ->andWhere('i.isPublic = :public')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('category', $category)
            ->setParameter('public', true)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Update with optimistic lock check
     */
    public function updateWithLock(Inventory $inventory, int $expectedVersion): bool
    {
        $affected = $this->createQueryBuilder('i')
            ->update()
            ->set('i.version', 'i.version + 1')
            ->set('i.updatedAt', ':now')
            ->where('i.id = :id')
            ->andWhere('i.version = :version')
            ->setParameter('id', $inventory->getId())
            ->setParameter('version', $expectedVersion)
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->execute();

        return $affected > 0;
    }

    public function save(Inventory $inventory, bool $flush = false): void
    {
        $this->getEntityManager()->persist($inventory);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Inventory $inventory, bool $flush = false): void
    {
        $this->getEntityManager()->remove($inventory);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
