<?php

namespace App\Controller;

use App\Entity\SalesforceProfile;
use App\Entity\User;
use App\Service\SalesforceClient;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/user/{id}/salesforce')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class SalesforceController extends AbstractController
{
    public function __construct(
        private SalesforceClient $salesforceClient,
        private EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/sync', name: 'api_user_salesforce_sync', methods: ['POST'])]
    public function sync(Request $request, User $user): JsonResponse
    {
        // Security check: Only allow Owner or Admin
        if ($user !== $this->getUser() && !$this->isGranted('ROLE_ADMIN')) {
            throw $this->createAccessDeniedException('You cannot sync another user to Salesforce.');
        }

        $data = json_decode($request->getContent(), true);
        $companyName = $data['company'] ?? null;
        $phone = $data['phone'] ?? null;
        $title = $data['title'] ?? null;

        if (!$companyName) {
            return $this->json(['error' => 'Company Name is required to create a Salesforce Account.'], 400);
        }

        // Check if already synced
        $existingProfile = $user->getSalesforceProfile();

        if ($existingProfile && $existingProfile->getProvider() === 'salesforce') {
             return $this->json(['error' => 'User is already synced with Salesforce.'], 400);
        }

        try {
            // 1. Create Account
            $accountId = $this->salesforceClient->createAccount($companyName);

            // 2. Create Contact
            $nameParts = explode(' ', $user->getName() ?? 'Unknown User', 2);
            $firstName = $nameParts[0];
            $lastName = $nameParts[1] ?? 'User';

            $contactId = $this->salesforceClient->createContact(
                firstName: $firstName,
                lastName: $lastName,
                email: $user->getEmail(),
                accountId: $accountId,
                phone: $phone,
                title: $title
            );

            // 3. Save Integration Profile
            $profile = new SalesforceProfile();
            $profile->setUser($user);
            $profile->setProvider('salesforce');
            $profile->setExternalAccountId($accountId);
            $profile->setExternalUserId($contactId);
            $profile->setLastSyncedAt(new \DateTime());
            $profile->setData([
                'company' => $companyName,
                'phone' => $phone,
                'title' => $title,
                'synced_by' => $this->getUser()->getUserIdentifier()
            ]);

            $this->entityManager->persist($profile);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'contactId' => $contactId,
                'accountId' => $accountId
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Salesforce sync failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
