<?php

namespace App\EventSubscriber;

use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class MercureCookieSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire('%env(MERCURE_JWT_SECRET)%')]
        private string $secret
    ) {}

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        
        // If cookie already exists (e.g. set by another listener), skip
        // But for now, let's overwrite/ensure it's there.
        
        // Use Lcobucci/JWT to generate token
        // Compatible with version 4.x as seen in composer.json
        $config = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($this->secret)
        );

        $token = $config->builder()
            ->withClaim('mercure', ['subscribe' => ['*']]) // Allow subscribing to everything
            ->getToken($config->signer(), $config->signingKey());

        $cookie = Cookie::create(
            'mercureAuthorization',
            $token->toString(),
            new \DateTime('+1 hour'),
            '/',     // Path
            null,    // Domain (null = current host, i.e., localhost)
            false,   // Secure (false for localhost dev, true for prod if https)
            true,    // HttpOnly
            false,   // Raw
            Cookie::SAMESITE_LAX
        );

        $response->headers->setCookie($cookie);
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }
}
