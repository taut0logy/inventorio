<?php

namespace App\Repository;

use App\Entity\Inventory;
use App\Entity\InventoryField;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InventoryField>
 */
class InventoryFieldRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InventoryField::class);
    }

    /**
     * Find all fields for an inventory, ordered by position
     */
    public function findByInventoryOrdered(Inventory $inventory): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.inventory = :inventory')
            ->setParameter('inventory', $inventory)
            ->orderBy('f.position', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find visible (non-hidden) fields for an inventory
     */
    public function findVisibleByInventory(Inventory $inventory): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.inventory = :inventory')
            ->andWhere('f.hidden = :hidden')
            ->setParameter('inventory', $inventory)
            ->setParameter('hidden', false)
            ->orderBy('f.position', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find required fields for an inventory
     */
    public function findRequiredByInventory(Inventory $inventory): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.inventory = :inventory')
            ->andWhere('f.required = :required')
            ->setParameter('inventory', $inventory)
            ->setParameter('required', true)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get the next position for a new field
     */
    public function getNextPosition(Inventory $inventory): int
    {
        $result = $this->createQueryBuilder('f')
            ->select('MAX(f.position)')
            ->where('f.inventory = :inventory')
            ->setParameter('inventory', $inventory)
            ->getQuery()
            ->getSingleScalarResult();

        return ($result ?? -1) + 1;
    }

    public function save(InventoryField $field, bool $flush = false): void
    {
        $this->getEntityManager()->persist($field);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InventoryField $field, bool $flush = false): void
    {
        $this->getEntityManager()->remove($field);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
