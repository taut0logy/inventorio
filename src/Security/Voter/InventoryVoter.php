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
    public const MANAGE_ACCESS = 'INVENTORY_MANAGE_ACCESS';
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
            self::MANAGE_ACCESS,
            self::ITEM_ADD,
            self::ITEM_EDIT,
            self::ITEM_DELETE
        ]) && $subject instanceof Inventory;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        /** @var Inventory $inventory */
        $inventory = $subject;

        // VIEW: public inventories are viewable by everyone (including anonymous)
        if ($attribute === self::VIEW && $inventory->isPublic()) {
            return true;
        }

        // All other operations require authentication
        if (!$user instanceof User) {
            return false;
        }

        // Admin has FULL access to everything (like owner)
        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        // Owner has FULL access
        if ($inventory->getCreator() === $user) {
            return true;
        }

        // Check if user is a collaborator (in sharedWith)
        $isCollaborator = $inventory->getSharedWith()->contains($user);

        switch ($attribute) {
            case self::VIEW:
                // Private inventory: only collaborators can view
                return $isCollaborator;
                
            case self::ITEM_ADD:
                // Public inventories: ANY authenticated user can add items
                // Private inventories: only collaborators
                return $inventory->isPublic() || $isCollaborator;
                
            case self::ITEM_EDIT:
            case self::ITEM_DELETE:
                // Only collaborators can edit/delete items (not random public users)
                return $isCollaborator;
                
            case self::EDIT:
                // Collaborators CAN edit inventory settings (title, desc, fields, ID config)
                return $isCollaborator;
                
            case self::DELETE:
            case self::MANAGE_ACCESS:
                // Only owner/admin can delete inventory or manage access
                // (already handled above - if we reach here, deny)
                return false;
        }

        return false;
    }
}

