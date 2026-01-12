<?php

namespace App\Controller;

use App\Repository\InventoryRepository;
use App\Repository\ItemRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/search')]
class SearchController extends AbstractController
{
    public function __construct(
        private InventoryRepository $inventoryRepository,
        private ItemRepository $itemRepository,
    ) {}

    #[Route('', name: 'api_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query->get('q', ''));
        $category = $request->query->get('category');
        $type = $request->query->get('type', 'all'); // all, inventories, items
        $limit = min((int) $request->query->get('limit', 10), 50);
        $offset = max((int) $request->query->get('offset', 0), 0);

        // Allow empty query if category is provided
        if (strlen($query) < 2 && !$category) {
            return $this->json([
                'inventories' => [],
                'items' => [],
                'total' => 0,
                'hasMore' => false,
                'message' => 'Query must be at least 2 characters or select a category'
            ]);
        }

        $user = $this->getUser();
        $inventories = [];
        $items = [];
        $hasMoreInventories = false;
        $hasMoreItems = false;

        // Search inventories
        if ($type === 'all' || $type === 'inventories') {
            // Fetch limit + 1 to check if there are more
            $inventoryResults = $this->inventoryRepository->searchFullText($query, $user, $limit + 1, $category, $offset);
            $hasMoreInventories = count($inventoryResults) > $limit;
            
            // Trim to actual limit
            if ($hasMoreInventories) {
                array_pop($inventoryResults);
            }
            
            $inventories = array_map(fn($row) => [
                'id' => $row[0]->getId()->toRfc4122(),
                'title' => $row[0]->getTitle(),
                'description' => mb_substr($row[0]->getDescription() ?? '', 0, 100),
                'imageUrl' => $row[0]->getImageUrl(),
                'isPublic' => $row[0]->isPublic(),
                'category' => [
                    'name' => $row[0]->getCategory()?->getName(),
                    'icon' => $row[0]->getCategory()?->getIconUrl(),
                ],
                'creator' => [
                    'name' => $row[0]->getCreator()?->getName(),
                ],
                'itemCount' => (int) $row['itemCount'],
            ], $inventoryResults);
        }

        // Search items - now supports category filtering and empty queries
        if ($type === 'all' || $type === 'items') {
            // For items, search if: query is provided OR category is selected
            if (!empty($query) || $category) {
                // Fetch limit + 1 to check if there are more
                $itemResults = $this->itemRepository->searchFullText($query, null, $limit + 1, $offset, $category);
                $hasMoreItems = count($itemResults) > $limit;
                
                // Trim to actual limit
                if ($hasMoreItems) {
                    array_pop($itemResults);
                }
                
                $items = array_map(fn($item) => [
                    'id' => $item->getId()->toRfc4122(),
                    'customId' => $item->getCustomId(),
                    'inventoryId' => $item->getInventory()->getId()->toRfc4122(),
                    'inventoryTitle' => $item->getInventory()->getTitle(),
                    'category' => $item->getInventory()->getCategory()?->getName(),
                    'preview' => $this->getItemPreview($item),
                ], $itemResults);
            }
        }

        return $this->json([
            'inventories' => $inventories,
            'items' => $items,
            'total' => count($inventories) + count($items),
            'hasMoreInventories' => $hasMoreInventories,
            'hasMoreItems' => $hasMoreItems,
            'hasMore' => $hasMoreInventories || $hasMoreItems,
            'query' => $query,
            'category' => $category,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * Get a preview string from item's first non-empty string field
     */
    private function getItemPreview($item): ?string
    {
        $fields = [
            $item->getCustomString1Value(),
            $item->getCustomString2Value(),
            $item->getCustomString3Value(),
        ];

        foreach ($fields as $value) {
            if (!empty($value)) {
                return mb_substr($value, 0, 80);
            }
        }

        return null;
    }
}
