<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if ($user->isBlocked()) {
            // the message passed to this exception is meant to be displayed to the user
            throw new CustomUserMessageAccountStatusException('Your account has been blocked by an administrator.');
        }
        
        if ($user->getDeletedAt() !== null) {
            throw new CustomUserMessageAccountStatusException('Your account no longer exists.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        // Check again post-auth just in case
        if ($user->isBlocked()) {
             throw new CustomUserMessageAccountStatusException('Your account has been blocked by an administrator.');
        }
    }
}
