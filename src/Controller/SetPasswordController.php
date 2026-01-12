<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Controller for setting password for OAuth users who don't have one.
 */
class SetPasswordController extends AbstractController
{
    #[Route('/set-password', name: 'app_set_password')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        // If user already has a password, redirect to profile
        if ($user->hasPassword()) {
            $this->addFlash('info', 'You already have a password set.');
            return $this->redirectToRoute('app_profile');
        }

        $errors = [];

        if ($request->isMethod('POST')) {
            $password = $request->request->get('password', '');
            $confirmPassword = $request->request->get('confirm_password', '');
            $csrfToken = $request->request->get('_csrf_token');

            // Validate CSRF
            if (!$this->isCsrfTokenValid('set_password', $csrfToken)) {
                $errors['global'] = 'Invalid CSRF token. Please try again.';
            }

            // Validate passwords match
            if ($password !== $confirmPassword) {
                $errors['confirm_password'] = 'Passwords do not match.';
            }

            // Validate password strength
            if (strlen($password) < 8) {
                $errors['password'] = 'Password must be at least 8 characters.';
            } elseif (!preg_match('/[a-z]/', $password)) {
                $errors['password'] = 'Password must contain a lowercase letter.';
            } elseif (!preg_match('/[A-Z]/', $password)) {
                $errors['password'] = 'Password must contain an uppercase letter.';
            } elseif (!preg_match('/[0-9]/', $password)) {
                $errors['password'] = 'Password must contain a number.';
            }

            if (empty($errors)) {
                // Hash and save password - handled in separate route for better flow
                return $this->forward(self::class . '::savePassword', [
                    'password' => $password,
                ]);
            }
        }

        return $this->render('security/set_password.html.twig', [
            'errors' => $errors,
            'user' => $user,
        ]);
    }

    #[Route('/set-password/save', name: 'app_set_password_save', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function savePassword(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): Response {
        /** @var User $user */
        $user = $this->getUser();

        $password = $request->request->get('password', '');
        $confirmPassword = $request->request->get('confirm_password', '');
        $csrfToken = $request->request->get('_csrf_token');

        // Validate CSRF
        if (!$this->isCsrfTokenValid('set_password', $csrfToken)) {
            $this->addFlash('error', 'Invalid request. Please try again.');
            return $this->redirectToRoute('app_set_password');
        }

        // Validate passwords match
        if ($password !== $confirmPassword) {
            $this->addFlash('error', 'Passwords do not match.');
            return $this->redirectToRoute('app_set_password');
        }

        // Validate password strength
        if (strlen($password) < 8) {
            $this->addFlash('error', 'Password must be at least 8 characters.');
            return $this->redirectToRoute('app_set_password');
        }

        // Hash and save
        $hashedPassword = $passwordHasher->hashPassword($user, $password);
        $user->setPassword($hashedPassword);
        $entityManager->flush();

        $this->addFlash('success', 'Password set successfully! You can now use it to log in.');
        return $this->redirectToRoute('app_home');
    }
}
