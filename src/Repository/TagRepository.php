<?php

namespace App\Repository;

use App\Entity\Tag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tag>
 */
class TagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tag::class);
    }

    /**
     * Find popular tags ordered by usage count (for tag cloud)
     * Returns array of [0 => Tag, 'inventoryCount' => int]
     */
    public function findPopular(int $limit = 50): array
    {
        return $this->getEntityManager()->createQueryBuilder()
            ->select('t', 'COUNT(i.id) as inventoryCount')
            ->from(Tag::class, 't')
            ->leftJoin('App\Entity\Inventory', 'i', 'WITH', 't MEMBER OF i.tags AND i.deletedAt IS NULL AND i.isPublic = true')
            ->where('t.deletedAt IS NULL')
            ->groupBy('t.id')
            ->orderBy('inventoryCount', 'DESC')
            ->addOrderBy('t.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find predefined tags
     */
    public function findPredefined(): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.isPredefined = :predefined')
            ->setParameter('predefined', true)
            ->orderBy('t.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Search tags by name (matches anywhere, ordered by relevance)
     * Returns tags where the query appears anywhere in the name
     * Ordered by: exact match first, then prefix match, then contains, then by popularity
     */
    public function searchByName(string $query, int $limit = 15): array
    {
        $q = mb_strtolower(trim($query));
        
        if (empty($q)) {
            return [];
        }

        // Use a CASE expression to score relevance:
        // 3 = exact match, 2 = starts with, 1 = contains
        return $this->getEntityManager()->createQueryBuilder()
            ->select('t')
            ->addSelect('COUNT(DISTINCT i.id) as HIDDEN usageCount')
            ->addSelect("CASE 
                WHEN LOWER(t.name) = :exact THEN 3
                WHEN LOWER(t.name) LIKE :prefix THEN 2
                ELSE 1
            END as HIDDEN relevance")
            ->from(Tag::class, 't')
            ->leftJoin('App\Entity\Inventory', 'i', 'WITH', 't MEMBER OF i.tags AND i.deletedAt IS NULL')
            ->where('LOWER(t.name) LIKE :contains')
            ->andWhere('t.deletedAt IS NULL')
            ->setParameter('exact', $q)
            ->setParameter('prefix', $q . '%')
            ->setParameter('contains', '%' . $q . '%')
            ->groupBy('t.id')
            ->orderBy('relevance', 'DESC')
            ->addOrderBy('usageCount', 'DESC')
            ->addOrderBy('t.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find or create tag by name
     */
    public function findOrCreate(string $name): Tag
    {
        $normalizedName = mb_strtolower(trim($name));
        
        $tag = $this->findOneBy(['name' => $normalizedName]);
        
        if (!$tag) {
            $tag = new Tag();
            $tag->setName($normalizedName);
        }
        
        return $tag;
    }

    public function save(Tag $tag, bool $flush = false): void
    {
        $this->getEntityManager()->persist($tag);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Tag $tag, bool $flush = false): void
    {
        $this->getEntityManager()->remove($tag);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function countItems(Tag $tag): int
    {
        return (int) $this->getEntityManager()->createQueryBuilder()
            ->select('COUNT(i.id)')
            ->from('App\Entity\Item', 'i')
            ->join('i.tags', 't')
            ->where('t.id = :tagId')
            ->setParameter('tagId', $tag->getId())
            ->getQuery()
            ->getSingleScalarResult();
    }
}
