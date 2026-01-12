<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use App\Entity\User;

/**
 * Enforces password setup for OAuth users who don't have a password set.
 * Redirects them to the set-password page until they create one.
 */
class PasswordEnforcementSubscriber implements EventSubscriberInterface
{
    // Routes that should be accessible without a password
    private const ALLOWED_ROUTES = [
        'app_set_password',
        'app_set_password_save',
        'app_switch_locale',
        'app_logout',
        'app_login',
        'app_register',
        '_wdt',
        '_profiler',
    ];

    public function __construct(
        private TokenStorageInterface $tokenStorage,
        private UrlGeneratorInterface $urlGenerator
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 0],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $route = $request->attributes->get('_route');

        if (str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }
        if (str_starts_with($request->getPathInfo(), '/_')) {
            return;
        }

        if (in_array($route, self::ALLOWED_ROUTES, true)) {
            return;
        }

        $token = $this->tokenStorage->getToken();
        if (!$token) {
            return;
        }

        $user = $token->getUser();
        if (!$user instanceof User) {
            return;
        }

        if ($user->hasPassword()) {
            return;
        }

        $setPasswordUrl = $this->urlGenerator->generate('app_set_password');
        $event->setResponse(new RedirectResponse($setPasswordUrl));
    }
}
