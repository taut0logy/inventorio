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
     */
    public function searchFullText(string $query, ?User $user = null, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('i')
            ->leftJoin('i.creator', 'u')
            ->leftJoin('i.category', 'c')
            ->where('i.deletedAt IS NULL');

        // Search condition - use ILIKE for case-insensitive partial match
        $searchCondition = $qb->expr()->orX(
            $qb->expr()->like('LOWER(i.title)', 'LOWER(:query)'),
            $qb->expr()->like('LOWER(i.description)', 'LOWER(:query)')
        );
        $qb->andWhere($searchCondition);

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

        $qb->setParameter('query', '%' . $query . '%')
           ->orderBy('i.createdAt', 'DESC')
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
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
     */
    public function findLatestPublic(int $limit = 10): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.isPublic = :true')
            ->andWhere('i.deletedAt IS NULL')
            ->setParameter('true', true)
            ->orderBy('i.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
