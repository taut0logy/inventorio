<?php

namespace App\Controller;

use App\Entity\User;
use App\Form\ChangePasswordFormType;
use App\Form\ProfileFormType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
#[Route('/profile')]
class ProfileController extends AbstractController
{
    #[Route('', name: 'app_profile')]
    public function index(): Response
    {
        return $this->render('profile/index.html.twig', [
            'user' => $this->getUser(),
        ]);
    }

    #[Route('/update', name: 'app_profile_update', methods: ['POST'])]
    public function update(Request $request, EntityManagerInterface $entityManager): Response
    {
        $user = $this->getUser();
        $form = $this->createForm(ProfileFormType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();
            $this->addFlash('success', 'Profile updated successfully.');
            // Refresh user in session/token if needed, but entity update usually reflects immediately
        } else {
            foreach ($this->getErrorsFromForm($form) as $field => $error) {
                // Flash generic error, but ideally we return JSON or render with errors
                // For simplified React handling, let's use Flash for success and redirect
                // But for validation errors, we need to pass them back.
                // Since we are doing a full page reload style submission (form action), 
                // we should render the page with errors.
                // But the page is at /profile, and this posts to /profile/update.
                // If we return render('profile/index'), the URL stays /profile/update. Correct.
                
                // However, ProfilePage React component needs to receive these errors.
                return $this->render('profile/index.html.twig', [
                    'user' => $user,
                    'profile_errors' => $this->getErrorsFromForm($form),
                    'active_tab' => 'general',
                ]);
            }
        }

        return $this->redirectToRoute('app_profile');
    }

    #[Route('/change-password', name: 'app_profile_change_password', methods: ['POST'])]
    public function changePassword(Request $request, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $entityManager): Response
    {
        $user = $this->getUser();
        
        // Ensure user has a password (OAuth users might not)
        if (!$user instanceof User) {
             throw $this->createAccessDeniedException();
        }

        $form = $this->createForm(ChangePasswordFormType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $encodedPassword = $passwordHasher->hashPassword(
                $user,
                $form->get('newPassword')->getData()
            );

            $user->setPassword($encodedPassword);
            $entityManager->flush();

            $this->addFlash('success', 'Password changed successfully.');
            return $this->redirectToRoute('app_profile');
        }

        return $this->render('profile/index.html.twig', [
            'user' => $user,
            'password_errors' => $this->getErrorsFromForm($form),
            'active_tab' => 'password',
        ]);
    }

    // Helper to extract errors (duplicate of SecurityController one, could be a Trait)
    private function getErrorsFromForm(\Symfony\Component\Form\FormInterface $form): array
    {
        $errors = [];
        foreach ($form->getErrors() as $error) {
            $errors['global'] = $error->getMessage();
        }
        foreach ($form->all() as $childForm) {
            foreach ($childForm->getErrors() as $error) {
                $errors[$childForm->getName()] = $error->getMessage();
            }
             if (($childForm->getName() === 'newPassword') && count($childForm->getErrors()) === 0) {
                 foreach ($childForm->all() as $subChild) {
                     foreach ($subChild->getErrors() as $error) {
                          if ($subChild->getName() === 'first') $errors['newPassword'] = $error->getMessage();
                          if ($subChild->getName() === 'second') $errors['confirmPassword'] = $error->getMessage();
                     }
                 }
            }
        }
        return $errors;
    }
}
