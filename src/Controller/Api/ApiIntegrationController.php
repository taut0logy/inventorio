<?php

namespace App\Controller\Api;

use App\Repository\InventoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Public API for external integrations (e.g., Odoo).
 * No authentication required - access is controlled by the API token.
 */
#[Route('/api/external')]
class ApiIntegrationController extends AbstractController
{
    public function __construct(
        private InventoryRepository $inventoryRepository,
    ) {
    }

    /**
     * Get aggregated inventory data by API token.
     * This endpoint is publicly accessible but requires a valid token.
     */
    #[Route('/inventory/{token}', name: 'api_external_inventory', methods: ['GET'])]
    public function getInventoryByToken(string $token): JsonResponse
    {
        try {
            $inventory = $this->inventoryRepository->findOneBy(['apiToken' => $token]);

            if (!$inventory) {
                return $this->json(['error' => 'Invalid or expired API token.'], 404);
            }

            // Get all items (non-deleted)
            $items = $inventory->getItems()->filter(fn($item) => $item->getDeletedAt() === null);

            // Get field definitions
            $fields = [];
            foreach ($inventory->getFields() as $field) {
                $fields[] = [
                    'name' => $field->getLabel(),
                    'type' => $field->getType(),
                    'required' => $field->isRequired(),
                ];
            }

            // Calculate aggregated stats
            $stats = $this->calculateStats($items->toArray(), $inventory);

            return $this->json([
                'title' => $inventory->getTitle(),
                'description' => $inventory->getDescription(),
                'createdAt' => $inventory->getCreatedAt()?->format('Y-m-d H:i:s'),
                'owner' => $inventory->getCreator()?->getName(),
                'category' => $inventory->getCategory()?->getName(),
                'isPublic' => $inventory->isPublic(),
                'totalItems' => count($items),
                'fields' => $fields,
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            return $this->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Calculate aggregated statistics for the inventory items.
     */
    private function calculateStats(array $items, $inventory): array
    {
        $stats = [
            'totalValue' => 0,
            'averageValue' => 0,
            'minValue' => null,
            'maxValue' => null,
            'viewCount' => $inventory->getViewCount(),
            'likeCount' => $inventory->getLikeCount(),
            'fieldStats' => [],
        ];

        if (empty($items)) {
            return $stats;
        }

        // Calculate stats for each custom field
        foreach ($inventory->getFields() as $field) {
            $fieldName = $field->getLabel();
            $fieldType = $field->getType();
            $values = [];

            foreach ($items as $item) {
                $customFields = $item->getFieldValuesArray() ?? [];
                if (isset($customFields[$field->getId()->toRfc4122()])) {
                    $values[] = $customFields[$field->getId()->toRfc4122()];
                }
            }

            if (empty($values)) {
                continue;
            }

            $fieldStat = ['name' => $fieldName, 'type' => $fieldType];

            if (in_array($fieldType, ['integer', 'number'])) {
                // Numeric stats
                $numericValues = array_filter($values, fn($v) => is_numeric($v));
                if (!empty($numericValues)) {
                    $fieldStat['min'] = min($numericValues);
                    $fieldStat['max'] = max($numericValues);
                    $fieldStat['average'] = round(array_sum($numericValues) / count($numericValues), 2);
                    $fieldStat['sum'] = array_sum($numericValues);

                    // Use first numeric field for totalValue
                    if ($stats['totalValue'] === 0) {
                        $stats['totalValue'] = $fieldStat['sum'];
                        $stats['averageValue'] = $fieldStat['average'];
                        $stats['minValue'] = $fieldStat['min'];
                        $stats['maxValue'] = $fieldStat['max'];
                    }
                }
            } elseif (in_array($fieldType, ['text', 'textarea', 'select'])) {
                // Text stats - most popular values
                $valueCounts = array_count_values(array_filter($values, 'is_string'));
                arsort($valueCounts);
                $fieldStat['mostPopular'] = array_slice(array_keys($valueCounts), 0, 5);
                $fieldStat['uniqueCount'] = count(array_unique($values));
            } elseif ($fieldType === 'checkbox') {
                // Boolean stats
                $trueCount = count(array_filter($values, fn($v) => $v === true || $v === 'true' || $v === 1));
                $fieldStat['trueCount'] = $trueCount;
                $fieldStat['falseCount'] = count($values) - $trueCount;
            }

            $stats['fieldStats'][] = $fieldStat;
        }

        return $stats;
    }
}
