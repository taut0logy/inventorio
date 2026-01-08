<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class LocaleController extends AbstractController
{
    #[Route('/switch-locale/{locale}', name: 'switch_locale')]
    public function switchLocale(string $locale, Request $request, EntityManagerInterface $entityManager): Response
    {
        // 1. Validate locale
        if (!in_array($locale, ['en', 'bn'], true)) {
            // Determine default or fallback behavior. For now, just accept what was passed or default to 'en'
            $locale = 'en'; 
        }

        // 2. Set session for immediate feedback (and for anon users)
        $request->getSession()->set('_locale', $locale);

        // 3. If logged in, save to User entity
        $user = $this->getUser();
        if ($user instanceof User) {
            $user->setLocale($locale);
            $entityManager->persist($user);
            $entityManager->flush();
        }

        // 4. Redirect back
        $referer = $request->headers->get('referer');
        return $this->redirect($referer ?: $this->generateUrl('app_home'));
    }
}
