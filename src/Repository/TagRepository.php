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
     * Find all tags ordered by usage count (for tag cloud)
     */
    public function findPopular(int $limit = 50): array
    {
        // This will be updated when Inventory entity is created
        return $this->createQueryBuilder('t')
            ->orderBy('t.name', 'ASC')
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
     * Search tags by name prefix
     */
    public function searchByName(string $query): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.name LIKE :query')
            ->setParameter('query', mb_strtolower($query) . '%')
            ->orderBy('t.name', 'ASC')
            ->setMaxResults(20)
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
}
