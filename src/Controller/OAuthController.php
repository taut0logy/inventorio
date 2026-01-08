<?php

namespace App\Controller;

use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class OAuthController extends AbstractController
{
    public function __construct(
        private ClientRegistry $clientRegistry,
    ) {}

    /**
     * Redirect to Google for authentication
     */
    #[Route('/connect/google', name: 'connect_google')]
    public function connectGoogle(): RedirectResponse
    {
        return $this->clientRegistry
            ->getClient('google')
            ->redirect([
                'email',
                'profile',
            ], []);
    }

    /**
     * Google callback - this route is handled by the authenticator
     */
    #[Route('/connect/google/check', name: 'connect_google_check')]
    public function connectGoogleCheck(Request $request): RedirectResponse
    {
        // This method will never be executed - the authenticator handles this
        return $this->redirectToRoute('app_home');
    }

    /**
     * Redirect to Facebook for authentication
     */
    #[Route('/connect/facebook', name: 'connect_facebook')]
    public function connectFacebook(): RedirectResponse
    {
        return $this->clientRegistry
            ->getClient('facebook')
            ->redirect([
                'email',
                'public_profile',
            ], []);
    }

    /**
     * Facebook callback - this route is handled by the authenticator
     */
    #[Route('/connect/facebook/check', name: 'connect_facebook_check')]
    public function connectFacebookCheck(Request $request): RedirectResponse
    {
        // This method will never be executed - the authenticator handles this
        return $this->redirectToRoute('app_home');
    }
}
