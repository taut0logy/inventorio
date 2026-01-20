<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\OneDriveService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class SupportTicketController extends AbstractController
{
    public function __construct(
        private OneDriveService $oneDriveService,
        private string $adminEmails,
    ) {
    }

    #[Route('/support-ticket', name: 'api_support_ticket_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createTicket(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (empty($data['summary'])) {
                return $this->json(['error' => 'Summary is required'], 400);
            }
            
            /** @var User $user */
            $user = $this->getUser();
            $ticketId = 'TICKET-' . date('Ymd-His');
            
            $ticketData = [
                'ticketId' => $ticketId,
                'summary' => $data['summary'],
                'priority' => $data['priority'] ?? 'Average',
                'reportedBy' => [
                    'name' => $user->getName() ?? $user->getEmail(),
                    'email' => $user->getEmail(),
                ],
                'inventory' => $data['inventory'] ?? null,
                'link' => $data['link'] ?? null,
                'timestamp' => (new \DateTime())->format('c'),
                'adminEmails' => array_map('trim', explode(',', $this->adminEmails)),
            ];
            
            $filename = $ticketId . '.json';
            $this->oneDriveService->uploadJsonFile($filename, $ticketData);
            
            return $this->json([
                'success' => true,
                'ticketId' => $ticketId,
                'message' => 'Support ticket created successfully.',
            ]);
            
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Failed to create support ticket: ' . $e->getMessage(),
            ], 500);
        }
    }
}

