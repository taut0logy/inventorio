<?php

namespace App\Security\Voter;

use App\Entity\Inventory;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Bundle\SecurityBundle\Security;

class InventoryVoter extends Voter
{
    public const VIEW = 'INVENTORY_VIEW';
    public const EDIT = 'INVENTORY_EDIT';
    public const DELETE = 'INVENTORY_DELETE';
    public const ITEM_ADD = 'ITEM_ADD';
    public const ITEM_EDIT = 'ITEM_EDIT';
    public const ITEM_DELETE = 'ITEM_DELETE';

    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [
            self::VIEW, 
            self::EDIT, 
            self::DELETE,
            self::ITEM_ADD,
            self::ITEM_EDIT,
            self::ITEM_DELETE
        ]) && $subject instanceof Inventory;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        // If 'VIEW' and inventory is public, grant access immediately (unless we want to block banned users, etc.)
        /** @var Inventory $inventory */
        $inventory = $subject; // Logic handles subject being Inventory. 
        // Note: For Item operations, the subject passed should be the Inventory (or Item->getInventory())
        // But for simplicity, we'll assume the subject IS the Inventory for all these attributes.
        // If the controller passes an Item, it should pass Item->getInventory().

        if ($attribute === self::VIEW) {
            if ($inventory->isPublic()) {
                return true;
            }
        }

        // If user is not logged in, they can only view public (handled above).
        if (!$user instanceof User) {
            return false;
        }

        // Admin has full access
        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        // Check ownership
        if ($inventory->getCreator() === $user) {
            return true;
        }

        // Check shared access
        switch ($attribute) {
            case self::VIEW:
            case self::ITEM_ADD:
            case self::ITEM_EDIT:
            case self::ITEM_DELETE:
                 if ($inventory->getSharedWith()->contains($user)) {
                     return true;
                 }
                 break;
            case self::EDIT:   // Inventory settings
            case self::DELETE: // Inventory delete
                // Shared users CANNOT edit inventory settings or delete inventory
                return false;
        }

        return false;
    }
}
