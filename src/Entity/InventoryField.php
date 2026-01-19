<?php

namespace App\Entity;

use App\Repository\InventoryFieldRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: InventoryFieldRepository::class)]
#[ORM\Table(name: 'inventory_fields')]
#[ORM\Index(columns: ['inventory_id', 'position'], name: 'idx_field_order')]
class InventoryField
{
    public const TYPE_STRING = 'string';
    public const TYPE_NUMBER = 'number';
    public const TYPE_TEXT = 'text';
    public const TYPE_LINK = 'link';
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_SELECT = 'select';

    public const TYPES = [
        self::TYPE_STRING,
        self::TYPE_NUMBER,
        self::TYPE_TEXT,
        self::TYPE_LINK,
        self::TYPE_BOOLEAN,
        self::TYPE_SELECT,
    ];

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Inventory::class, inversedBy: 'fields')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Inventory $inventory = null;

    #[ORM\Column(length: 20)]
    private string $type = self::TYPE_STRING;

    #[ORM\Column(length: 255)]
    private string $label;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 0;

    #[ORM\Column]
    private bool $hidden = false;

    #[ORM\Column(name: 'is_required')]
    private bool $required = false;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $regex = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $min = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $max = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $options = null;

    public function __construct(string $label = '', string $type = self::TYPE_STRING, int $position = 0)
    {
        $this->id = Uuid::v7();
        $this->label = $label;
        $this->type = $type;
        $this->position = $position;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getInventory(): ?Inventory
    {
        return $this->inventory;
    }

    public function setInventory(?Inventory $inventory): static
    {
        $this->inventory = $inventory;
        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        if (!in_array($type, self::TYPES)) {
            throw new \InvalidArgumentException("Invalid field type: $type");
        }
        $this->type = $type;
        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function isHidden(): bool
    {
        return $this->hidden;
    }

    public function setHidden(bool $hidden): static
    {
        $this->hidden = $hidden;
        return $this;
    }

    public function isRequired(): bool
    {
        return $this->required;
    }

    public function setRequired(bool $required): static
    {
        $this->required = $required;
        return $this;
    }

    public function getRegex(): ?string
    {
        return $this->regex;
    }

    public function setRegex(?string $regex): static
    {
        $this->regex = $regex;
        return $this;
    }

    public function getMin(): ?float
    {
        return $this->min !== null ? (float)$this->min : null;
    }

    public function setMin(?float $min): static
    {
        $this->min = $min !== null ? (string)$min : null;
        return $this;
    }

    public function getMax(): ?float
    {
        return $this->max !== null ? (float)$this->max : null;
    }

    public function setMax(?float $max): static
    {
        $this->max = $max !== null ? (string)$max : null;
        return $this;
    }

    public function getOptions(): ?array
    {
        return $this->options;
    }

    public function setOptions(?array $options): static
    {
        $this->options = $options;
        return $this;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id->toRfc4122(),
            'type' => $this->type,
            'label' => $this->label,
            'description' => $this->description,
            'position' => $this->position,
            'hidden' => $this->hidden,
            'required' => $this->required,
            'regex' => $this->regex,
            'min' => $this->getMin(),
            'max' => $this->getMax(),
            'options' => $this->options,
        ];
    }
}
