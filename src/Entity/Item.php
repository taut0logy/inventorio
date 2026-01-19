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

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'item_likes')]
    private Collection $likedBy;

    #[ORM\Column(length: 255)]
    private ?string $customId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 1])]
    #[ORM\Version]
    private int $version = 1;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $sequenceNumber = 0;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $likeCount = 0;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $deletedAt = null;

    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'item_tags')]
    private Collection $tags;

    #[ORM\OneToMany(targetEntity: ItemFieldValue::class, mappedBy: 'item', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $fieldValues;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->tags = new ArrayCollection();
        $this->likedBy = new ArrayCollection();
        $this->fieldValues = new ArrayCollection();
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

    /**
     * @return Collection<int, User>
     */
    public function getLikedBy(): Collection
    {
        return $this->likedBy;
    }

    public function addLikedBy(User $user): static
    {
        if (!$this->likedBy->contains($user)) {
            $this->likedBy->add($user);
            $this->likeCount++;
        }
        return $this;
    }

    public function removeLikedBy(User $user): static
    {
        if ($this->likedBy->removeElement($user)) {
            $this->likeCount = max(0, $this->likeCount - 1);
        }
        return $this;
    }

    public function isLikedBy(User $user): bool
    {
        return $this->likedBy->contains($user);
    }

    /**
     * @return Collection<int, ItemFieldValue>
     */
    public function getFieldValues(): Collection
    {
        return $this->fieldValues;
    }

    public function addFieldValue(ItemFieldValue $fieldValue): static
    {
        if (!$this->fieldValues->contains($fieldValue)) {
            $this->fieldValues->add($fieldValue);
            $fieldValue->setItem($this);
        }
        return $this;
    }

    public function removeFieldValue(ItemFieldValue $fieldValue): static
    {
        if ($this->fieldValues->removeElement($fieldValue)) {
            if ($fieldValue->getItem() === $this) {
                $fieldValue->setItem(null);
            }
        }
        return $this;
    }

    /**
     * Get field value by field entity
     */
    public function getFieldValue(InventoryField $field): mixed
    {
        foreach ($this->fieldValues as $fv) {
            if ($fv->getField()?->getId()?->equals($field->getId())) {
                return $fv->getValue();
            }
        }
        return null;
    }

    /**
     * Get field value by field ID string
     */
    public function getFieldValueById(string $fieldId): mixed
    {
        foreach ($this->fieldValues as $fv) {
            if ($fv->getField()?->getId()?->toRfc4122() === $fieldId) {
                return $fv->getValue();
            }
        }
        return null;
    }

    /**
     * Set or create a field value
     */
    public function setFieldValue(InventoryField $field, mixed $value): static
    {
        // Find existing value
        foreach ($this->fieldValues as $fv) {
            if ($fv->getField()?->getId()?->equals($field->getId())) {
                $fv->setValue($value);
                return $this;
            }
        }

        // Create new value
        $fv = new ItemFieldValue();
        $fv->setField($field);
        $fv->setValue($value);
        $this->addFieldValue($fv);

        return $this;
    }

    /**
     * Get all field values as associative array [fieldId => value]
     */
    public function getFieldValuesArray(): array
    {
        $result = [];
        foreach ($this->fieldValues as $fv) {
            $fieldId = $fv->getField()?->getId()?->toRfc4122();
            if ($fieldId) {
                $result[$fieldId] = $fv->getValue();
            }
        }
        return $result;
    }
}
