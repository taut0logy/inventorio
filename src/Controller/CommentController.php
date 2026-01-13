<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Inventory;
use App\Repository\CommentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Service\RealTimeNotifier;

#[Route('/api/inventories/{id}/comments')]
class CommentController extends AbstractController
{
    public function __construct(
        private CommentRepository $commentRepository,
        private EntityManagerInterface $entityManager,
        private RealTimeNotifier $notifier
    ) {}

    #[Route('', name: 'api_comments_list', methods: ['GET'])]
    public function list(Inventory $inventory): JsonResponse
    {
        // Assuming all inventories are publicly readable. 
        // If privacy is added later, check here.

        $comments = $this->commentRepository->findBy(
            ['inventory' => $inventory],
            ['createdAt' => 'ASC'] // Chronological order for chat-like experience
        );

        return $this->json(array_map(fn(Comment $c) => [
            'id' => $c->getId()->toRfc4122(),
            'content' => $c->getContent(),
            'createdAt' => $c->getCreatedAt()->format('c'),
            'user' => [
                'id' => $c->getUser()->getId()->toRfc4122(),
                'name' => $c->getUser()->getName(),
                'avatarUrl' => $c->getUser()->getAvatarUrl(),
            ]
        ], $comments));
    }

    #[Route('', name: 'api_comments_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, Inventory $inventory): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $content = trim($data['content'] ?? '');

        if (empty($content)) {
            return $this->json(['message' => 'Content cannot be empty'], 400);
        }

        $comment = new Comment();
        $comment->setContent($content);
        $comment->setUser($this->getUser());
        $comment->setInventory($inventory);

        $this->entityManager->persist($comment);
        $this->entityManager->flush();

        // Broadcast real-time update
        $this->notifier->notifyNewComment($inventory->getId()->toRfc4122(), $comment);

        return $this->json([
            'id' => $comment->getId()->toRfc4122(),
            'content' => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format('c'),
            'user' => [
                'id' => $comment->getUser()->getId()->toRfc4122(),
                'name' => $comment->getUser()->getName(),
                'avatarUrl' => $comment->getUser()->getAvatarUrl(),
            ]
        ], 201);
    }
}
