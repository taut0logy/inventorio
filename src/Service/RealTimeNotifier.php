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
     * Publish a new activity (to both inventory and user topics)
     */
    public function notifyNewActivity(string $inventoryId, object $activity): void
    {
        $data = $this->formatActivityData($activity);

        // Publish to inventory topic
        $inventoryUpdate = new Update(
            "/inventory/{$inventoryId}/activities",
            json_encode(['type' => 'activity', 'data' => $data]),
            false
        );
        $this->hub->publish($inventoryUpdate);

        // Also publish to user topic
        $userId = $activity->getUser()->getId()->toRfc4122();
        $userUpdate = new Update(
            "/user/{$userId}/activities",
            json_encode(['type' => 'activity', 'data' => $data]),
            false
        );
        $this->hub->publish($userUpdate);
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

    /**
     * Format activity data for Mercure
     */
    private function formatActivityData(object $activity): array
    {
        return [
            'id' => $activity->getId()->toRfc4122(),
            'type' => $activity->getType(),
            'user' => [
                'id' => $activity->getUser()->getId()->toRfc4122(),
                'name' => $activity->getUser()->getName(),
                'avatarUrl' => $activity->getUser()->getAvatarUrl()
            ],
            'inventory' => [
                'id' => $activity->getInventory()->getId()->toRfc4122(),
                'title' => $activity->getInventory()->getTitle(),
            ],
            'isAdminAction' => $activity->isAdminAction(),
            'metadata' => $activity->getMetadata(),
            'createdAt' => $activity->getCreatedAt()->format('c')
        ];
    }
}
