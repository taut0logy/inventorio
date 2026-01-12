<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

class AccessControlSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private TokenStorageInterface $tokenStorage,
        private RouterInterface $router,
        private AuthorizationCheckerInterface $authChecker,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
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

        if ($user->isBlocked()) {
            $this->tokenStorage->setToken(null);
            $event->getRequest()->getSession()->invalidate();

            
            $response = new RedirectResponse($this->router->generate('app_login'));
            $event->setResponse($response);
            return;
        }

        if (!$user->isVerified()) {
            $currentRoute = $event->getRequest()->attributes->get('_route');
            
            $allowedRoutes = [
                'app_home',
                'app_switch_locale',
                'app_verify_pending',
                'app_verify_resend',
                'app_verify_email',
                'app_logout',
                '_wdt',
                '_profiler',
                '_profiler_home',
                '_profiler_search',
                '_profiler_search_bar',
                '_profiler_phpinfo',
                '_profiler_search_results',
                '_profiler_open_file',
                '_profiler_router',
                '_profiler_exception',
                '_profiler_exception_css',
            ];

            if (in_array($currentRoute, $allowedRoutes)) {
                return;
            }

            $response = new RedirectResponse($this->router->generate('app_verify_pending'));
            $event->setResponse($response);
        }
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 7],
        ];
    }
}
