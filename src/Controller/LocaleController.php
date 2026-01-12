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
        if (!in_array($locale, ['en', 'bn'], true)) {
            $locale = 'en'; 
        }

        $request->getSession()->set('_locale', $locale);

        $user = $this->getUser();
        if ($user instanceof User) {
            $user->setLocale($locale);
            $entityManager->persist($user);
            $entityManager->flush();
        }

        $referer = $request->headers->get('referer');
        return $this->redirect($referer ?: $this->generateUrl('app_home'));
    }
}
