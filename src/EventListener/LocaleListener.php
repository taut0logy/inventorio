<?php

namespace App\EventListener;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class LocaleListener
{
    public function __construct(
        private Security $security,
    ) {
    }

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 5)]
    public function onKernelRequest(RequestEvent $event): void
    {
        $user = $this->security->getUser();

        if ($user && method_exists($user, 'getLocale')) {
            $event->getRequest()->setLocale($user->getLocale());
        }
    }
}
