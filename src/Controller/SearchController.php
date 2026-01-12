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

        if (strlen($query) < 2 && !$category) {
            return $this->json([
                'inventories' => [],
                'items' => [],
                'total' => 0,
                'message' => 'Query must be at least 2 characters'
            ]);
        }

        $user = $this->getUser();
        $inventories = [];
        $items = [];

        // Search inventories
        if ($type === 'all' || $type === 'inventories') {
            $inventoryResults = $this->inventoryRepository->searchFullText($query, $user, $limit, $category);
            $inventories = array_map(fn($inv) => [
                'id' => $inv->getId()->toRfc4122(),
                'title' => $inv->getTitle(),
                'description' => mb_substr($inv->getDescription() ?? '', 0, 100),
                'imageUrl' => $inv->getImageUrl(),
                'isPublic' => $inv->isPublic(),
                'category' => [
                    'name' => $inv->getCategory()?->getName(),
                    'icon' => $inv->getCategory()?->getIconUrl(),
                ],
                'creator' => [
                    'name' => $inv->getCreator()?->getName(),
                ],
                'itemCount' => $inv->getItems()->count(),
            ], $inventoryResults);
        }

        // Search items (only if query is provided, as items don't strictly belong to categories in the same way, or we could filter items by parent inventory category if needed, but for now lets keep it simple)
        // Actually, if category is selected, we probably only want to show inventories, or we need to filter items by their inventory's category.
        // For now, let's only search items if query is present, ignoring category filter for items or disabling item search if only category is present.
        if (!empty($query) && ($type === 'all' || $type === 'items')) {
            $itemResults = $this->itemRepository->searchFullText($query, null, $limit);
            $items = array_map(fn($item) => [
                'id' => $item->getId()->toRfc4122(),
                'customId' => $item->getCustomId(),
                'inventoryId' => $item->getInventory()->getId()->toRfc4122(),
                'inventoryTitle' => $item->getInventory()->getTitle(),
                'preview' => $this->getItemPreview($item),
            ], $itemResults);
        }

        return $this->json([
            'inventories' => $inventories,
            'items' => $items,
            'total' => count($inventories) + count($items),
            'query' => $query,
            'category' => $category,
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
