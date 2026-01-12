<?php

namespace App\Controller;

use App\Entity\User;
use App\Form\ChangePasswordFormType;
use App\Form\ProfileFormType;
use App\Service\CloudinaryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
#[Route('/profile')]
class ProfileController extends AbstractController
{
    public function __construct(
        private ?CloudinaryService $cloudinaryService = null
    ) {}

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
        /** @var User $user */
        $user = $this->getUser();
        $form = $this->createForm(ProfileFormType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // Handle avatar upload if present (it's not mapped to entity)
            $avatarFile = $form->get('avatar')->getData();
            if ($avatarFile) {
                try {
                    if ($this->cloudinaryService) {
                        // Upload to Cloudinary with user ID as public_id for easy overwrites
                        $result = $this->cloudinaryService->upload(
                            $avatarFile,
                            'inventorio/avatars',
                            'user_' . $user->getId()->toRfc4122()
                        );
                        $user->setAvatarUrl($result['url']);
                    }
                } catch (\Exception $e) {
                    $this->addFlash('error', 'Failed to upload avatar: ' . $e->getMessage());
                }
            }

            $entityManager->flush();
            $this->addFlash('success', 'Profile updated successfully.');
            return $this->redirectToRoute('app_profile');
        }

        // Form has errors
        return $this->render('profile/index.html.twig', [
            'user' => $user,
            'profile_errors' => $this->getErrorsFromForm($form),
            'active_tab' => 'general',
        ]);
    }

    #[Route('/change-password', name: 'app_profile_change_password', methods: ['POST'])]
    public function changePassword(Request $request, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $entityManager): Response
    {
        $user = $this->getUser();
        
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
