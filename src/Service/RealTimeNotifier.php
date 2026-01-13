<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

class RealTimeNotifier
{
    public function __construct(
        private HubInterface $hub,
        private SerializerInterface $serializer
    ) {}

    /**
     * Publish inventory stats update (views/likes)
     */
    public function notifyInventoryStats(string $inventoryId, array $stats): void
    {
        $update = new Update(
            "/inventory/{$inventoryId}",
            json_encode(['type' => 'stats', 'data' => $stats]),
            false // Public update
        );

        $this->hub->publish($update);
    }

    /**
     * Publish a new comment
     */
    public function notifyNewComment(string $inventoryId, object $comment): void
    {
        $data = $this->serializer->serialize($comment, 'json', ['groups' => 'comment:read']);
        
        $update = new Update(
            "/inventory/{$inventoryId}/comments",
            json_encode(['type' => 'comment', 'data' => json_decode($data)]),
            false // Can be public
        );

        $this->hub->publish($update);
    }

    /**
     * Publish a new activity
     */
    public function notifyNewActivity(string $inventoryId, object $activity): void
    {
        // Serialize manually or use groups to avoid circular refs/too much data
        $data = [
            'id' => $activity->getId(),
            'type' => $activity->getType(),
            'description' => $activity->getType(), // Or translated description if possible, but frontend handles translation
            'user' => [
                'fullName' => $activity->getUser()->getName(),
                'email' => $activity->getUser()->getEmail(),
                'avatar' => $activity->getUser()->getAvatarUrl()
            ],
            'createdAt' => $activity->getCreatedAt()->format('c'),
            'metadata' => $activity->getMetadata()
        ];

        $update = new Update(
            "/inventory/{$inventoryId}/activities",
            json_encode(['type' => 'activity', 'data' => $data]),
            false
        );

        $this->hub->publish($update);
    }

    /**
     * Publish item stats update (likes)
     */
    public function notifyItemStats(string $inventoryId, string $itemId, array $stats): void
    {
        $update = new Update(
            "/inventory/{$inventoryId}", // Reuse main inventory topic to reduce connections
            json_encode([
                'type' => 'item_stats', 
                'itemId' => $itemId,
                'data' => $stats
            ]),
            false // Public
        );

        $this->hub->publish($update);
    }
}
