<?php

namespace App\Repository;

use App\Entity\Inventory;
use App\Entity\InventoryField;
use App\Entity\Item;
use App\Entity\ItemFieldValue;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ItemFieldValue>
 */
class ItemFieldValueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ItemFieldValue::class);
    }

    /**
     * Find all values for an item
     */
    public function findByItem(Item $item): array
    {
        return $this->createQueryBuilder('v')
            ->where('v.item = :item')
            ->setParameter('item', $item)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find value for a specific item and field
     */
    public function findByItemAndField(Item $item, InventoryField $field): ?ItemFieldValue
    {
        return $this->createQueryBuilder('v')
            ->where('v.item = :item')
            ->andWhere('v.field = :field')
            ->setParameter('item', $item)
            ->setParameter('field', $field)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Check if a field has any non-null values (for delete confirmation)
     */
    public function fieldHasData(InventoryField $field): bool
    {
        $count = $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.field = :field')
            ->andWhere('v.stringValue IS NOT NULL OR v.numberValue IS NOT NULL OR v.boolValue IS NOT NULL')
            ->setParameter('field', $field)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    /**
     * Count items with data for a field
     */
    public function countItemsWithFieldData(InventoryField $field): int
    {
        return (int) $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.field = :field')
            ->andWhere('v.stringValue IS NOT NULL OR v.numberValue IS NOT NULL OR v.boolValue IS NOT NULL')
            ->setParameter('field', $field)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Delete all values for a field
     */
    public function deleteByField(InventoryField $field): int
    {
        return $this->createQueryBuilder('v')
            ->delete()
            ->where('v.field = :field')
            ->setParameter('field', $field)
            ->getQuery()
            ->execute();
    }

    /**
     * Delete all values for an item
     */
    public function deleteByItem(Item $item): int
    {
        return $this->createQueryBuilder('v')
            ->delete()
            ->where('v.item = :item')
            ->setParameter('item', $item)
            ->getQuery()
            ->execute();
    }

    public function save(ItemFieldValue $value, bool $flush = false): void
    {
        $this->getEntityManager()->persist($value);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ItemFieldValue $value, bool $flush = false): void
    {
        $this->getEntityManager()->remove($value);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
