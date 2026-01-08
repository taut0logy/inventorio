<?php

namespace App\Controller;

use App\Entity\Inventory;
use App\Entity\Item;
use App\Repository\ItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/items')]
class ItemController extends AbstractController
{
    #[Route('/new/{inventory}', name: 'app_item_new', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function new(
        Inventory $inventory,
        Request $request,
        ItemRepository $itemRepository,
        EntityManagerInterface $entityManager
    ): Response {
        // Security check: Only creator can add items (for now)
        if ($inventory->getCreator() !== $this->getUser()) {
             // TODO: Add proper voter check later
             return $this->json(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);
        
        // Basic validation
        if (empty($data['customId'])) {
            return $this->json(['error' => 'Custom ID is required'], 400);
        }

        // Check for duplicate Custom ID
        if ($itemRepository->customIdExists($inventory, $data['customId'])) {
            return $this->json(['error' => 'Custom ID already exists in this inventory'], 400);
        }

        $item = new Item();
        $item->setInventory($inventory);
        $item->setCreatedBy($this->getUser());
        $item->setCustomId($data['customId']);
        $item->setSequenceNumber($itemRepository->getNextSequenceNumber($inventory));

        // Map basic custom fields (just a few for now as verification)
        if (isset($data['customString1'])) $item->setCustomString1Value($data['customString1']);
        if (isset($data['customString2'])) $item->setCustomString2Value($data['customString2']);
        if (isset($data['customNumber1'])) $item->setCustomNumber1Value($data['customNumber1']);
        if (isset($data['customText1'])) $item->setCustomText1Value($data['customText1']);

        $entityManager->persist($item);
        $entityManager->flush();

        return $this->json([
            'id' => $item->getId()->toRfc4122(),
            'message' => 'Item created successfully'
        ], 201);
    }
}
