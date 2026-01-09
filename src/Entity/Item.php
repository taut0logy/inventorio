<?php

namespace App\Entity;

use App\Repository\ItemRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Gedmo\Mapping\Annotation as Gedmo;

#[ORM\Entity(repositoryClass: ItemRepository::class)]
#[ORM\Table(name: 'items')]
#[Gedmo\SoftDeleteable(fieldName: 'deletedAt', timeAware: false, hardDelete: true)]
#[ORM\UniqueConstraint(name: 'unique_custom_id_per_inventory', columns: ['inventory_id', 'custom_id'])]
#[ORM\HasLifecycleCallbacks]
class Item
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Inventory::class, inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Inventory $inventory = null;

    #[ORM\Column(length: 255)]
    private ?string $customId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 1])]
    private int $version = 1;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $sequenceNumber = 0;

    // ========================================
    // Custom String Fields (3 max)
    // ========================================
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $customString1Value = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $customString2Value = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $customString3Value = null;

    // ========================================
    // Custom Text Fields (3 max) - Multi-line
    // ========================================
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $customText1Value = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $customText2Value = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $customText3Value = null;

    // ========================================
    // Custom Number Fields (3 max)
    // ========================================
    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $customNumber1Value = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $customNumber2Value = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 4, nullable: true)]
    private ?string $customNumber3Value = null;

    // ========================================
    // Custom Link Fields (3 max) - Document/Image URLs
    // ========================================
    #[ORM\Column(length: 1000, nullable: true)]
    private ?string $customLink1Value = null;

    #[ORM\Column(length: 1000, nullable: true)]
    private ?string $customLink2Value = null;

    #[ORM\Column(length: 1000, nullable: true)]
    private ?string $customLink3Value = null;

    // ========================================
    // Custom Boolean Fields (3 max)
    // ========================================
    #[ORM\Column(nullable: true)]
    private ?bool $customBool1Value = null;

    #[ORM\Column(nullable: true)]
    private ?bool $customBool2Value = null;

    #[ORM\Column(nullable: true)]
    private ?bool $customBool3Value = null;

    // ========================================
    // Denormalized / Computed Fields
    // ========================================
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $likeCount = 0;

    // ========================================
    // Timestamps
    // ========================================
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $deletedAt = null;

    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'item_tags')]
    private Collection $tags;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->tags = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTime();
    }

    // ========================================
    // ID & Relations Getters/Setters
    // ========================================

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

    public function getCustomId(): ?string
    {
        return $this->customId;
    }

    public function setCustomId(string $customId): static
    {
        $this->customId = $customId;
        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;
        return $this;
    }

    // ========================================
    // Version & Sequence
    // ========================================

    public function getVersion(): int
    {
        return $this->version;
    }

    public function incrementVersion(): static
    {
        $this->version++;
        return $this;
    }

    public function getSequenceNumber(): int
    {
        return $this->sequenceNumber;
    }

    public function setSequenceNumber(int $sequenceNumber): static
    {
        $this->sequenceNumber = $sequenceNumber;
        return $this;
    }

    // ========================================
    // Custom Field Getters/Setters (Dynamic)
    // ========================================

    public function getCustomField(string $type, int $index): mixed
    {
        $property = "custom{$type}{$index}Value";
        return $this->$property ?? null;
    }

    public function setCustomField(string $type, int $index, mixed $value): static
    {
        $property = "custom{$type}{$index}Value";
        $this->$property = $value;
        return $this;
    }

    // String fields
    public function getCustomString1Value(): ?string { return $this->customString1Value; }
    public function setCustomString1Value(?string $value): static { $this->customString1Value = $value; return $this; }
    public function getCustomString2Value(): ?string { return $this->customString2Value; }
    public function setCustomString2Value(?string $value): static { $this->customString2Value = $value; return $this; }
    public function getCustomString3Value(): ?string { return $this->customString3Value; }
    public function setCustomString3Value(?string $value): static { $this->customString3Value = $value; return $this; }

    // Text fields
    public function getCustomText1Value(): ?string { return $this->customText1Value; }
    public function setCustomText1Value(?string $value): static { $this->customText1Value = $value; return $this; }
    public function getCustomText2Value(): ?string { return $this->customText2Value; }
    public function setCustomText2Value(?string $value): static { $this->customText2Value = $value; return $this; }
    public function getCustomText3Value(): ?string { return $this->customText3Value; }
    public function setCustomText3Value(?string $value): static { $this->customText3Value = $value; return $this; }

    // Number fields
    public function getCustomNumber1Value(): ?string { return $this->customNumber1Value; }
    public function setCustomNumber1Value(?string $value): static { $this->customNumber1Value = $value; return $this; }
    public function getCustomNumber2Value(): ?string { return $this->customNumber2Value; }
    public function setCustomNumber2Value(?string $value): static { $this->customNumber2Value = $value; return $this; }
    public function getCustomNumber3Value(): ?string { return $this->customNumber3Value; }
    public function setCustomNumber3Value(?string $value): static { $this->customNumber3Value = $value; return $this; }

    // Link fields
    public function getCustomLink1Value(): ?string { return $this->customLink1Value; }
    public function setCustomLink1Value(?string $value): static { $this->customLink1Value = $value; return $this; }
    public function getCustomLink2Value(): ?string { return $this->customLink2Value; }
    public function setCustomLink2Value(?string $value): static { $this->customLink2Value = $value; return $this; }
    public function getCustomLink3Value(): ?string { return $this->customLink3Value; }
    public function setCustomLink3Value(?string $value): static { $this->customLink3Value = $value; return $this; }

    // Boolean fields
    public function getCustomBool1Value(): ?bool { return $this->customBool1Value; }
    public function setCustomBool1Value(?bool $value): static { $this->customBool1Value = $value; return $this; }
    public function getCustomBool2Value(): ?bool { return $this->customBool2Value; }
    public function setCustomBool2Value(?bool $value): static { $this->customBool2Value = $value; return $this; }
    public function getCustomBool3Value(): ?bool { return $this->customBool3Value; }
    public function setCustomBool3Value(?bool $value): static { $this->customBool3Value = $value; return $this; }

    // ========================================
    // Like Count
    // ========================================

    public function getLikeCount(): int
    {
        return $this->likeCount;
    }

    public function incrementLikeCount(): static
    {
        $this->likeCount++;
        return $this;
    }

    public function decrementLikeCount(): static
    {
        if ($this->likeCount > 0) {
            $this->likeCount--;
        }
        return $this;
    }

    // ========================================
    // Timestamps & Soft Delete
    // ========================================

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?\DateTimeInterface
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeInterface $deletedAt): static
    {
        $this->deletedAt = $deletedAt;
        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function softDelete(): static
    {
        $this->deletedAt = new \DateTime();
        return $this;
    }

    public function restore(): static
    {
        $this->deletedAt = null;
        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }
}
