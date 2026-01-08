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

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 20)]
    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $user = $this->security->getUser();

        if ($user && method_exists($user, 'getLocale')) {
           $request->setLocale($user->getLocale());
        } elseif ($request->hasPreviousSession() && $sessionLocale = $request->getSession()->get('_locale')) {
            $request->setLocale($sessionLocale);
        }
    }
}
