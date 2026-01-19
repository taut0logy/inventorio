<?php

namespace App\Entity;

use App\Repository\ItemFieldValueRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ItemFieldValueRepository::class)]
#[ORM\Table(name: 'item_field_values')]
#[ORM\UniqueConstraint(name: 'unique_item_field', columns: ['item_id', 'field_id'])]
#[ORM\Index(columns: ['string_value'], name: 'idx_string_value')]
class ItemFieldValue
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Item::class, inversedBy: 'fieldValues')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Item $item = null;

    #[ORM\ManyToOne(targetEntity: InventoryField::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?InventoryField $field = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $stringValue = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $numberValue = null;

    #[ORM\Column(nullable: true)]
    private ?bool $boolValue = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getItem(): ?Item
    {
        return $this->item;
    }

    public function setItem(?Item $item): static
    {
        $this->item = $item;
        return $this;
    }

    public function getField(): ?InventoryField
    {
        return $this->field;
    }

    public function setField(?InventoryField $field): static
    {
        $this->field = $field;
        return $this;
    }

    public function getStringValue(): ?string
    {
        return $this->stringValue;
    }

    public function setStringValue(?string $stringValue): static
    {
        $this->stringValue = $stringValue;
        return $this;
    }

    public function getNumberValue(): ?float
    {
        return $this->numberValue !== null ? (float)$this->numberValue : null;
    }

    public function setNumberValue(?float $numberValue): static
    {
        $this->numberValue = $numberValue !== null ? (string)$numberValue : null;
        return $this;
    }

    public function getBoolValue(): ?bool
    {
        return $this->boolValue;
    }

    public function setBoolValue(?bool $boolValue): static
    {
        $this->boolValue = $boolValue;
        return $this;
    }

    /**
     * Get the value based on field type
     */
    public function getValue(): mixed
    {
        if (!$this->field) {
            return null;
        }

        return match ($this->field->getType()) {
            InventoryField::TYPE_NUMBER => $this->getNumberValue(),
            InventoryField::TYPE_BOOLEAN => $this->boolValue,
            default => $this->stringValue,
        };
    }

    /**
     * Set the value based on field type
     */
    public function setValue(mixed $value): static
    {
        if (!$this->field) {
            return $this;
        }

        // Reset all values
        $this->stringValue = null;
        $this->numberValue = null;
        $this->boolValue = null;

        if ($value === null || $value === '') {
            return $this;
        }

        match ($this->field->getType()) {
            InventoryField::TYPE_NUMBER => $this->setNumberValue((float)$value),
            InventoryField::TYPE_BOOLEAN => $this->boolValue = (bool)$value,
            default => $this->stringValue = (string)$value,
        };

        return $this;
    }

    /**
     * Check if value is empty
     */
    public function isEmpty(): bool
    {
        return $this->stringValue === null 
            && $this->numberValue === null 
            && $this->boolValue === null;
    }
}
