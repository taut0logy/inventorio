<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/categories')]
#[IsGranted('ROLE_ADMIN')]
class AdminCategoryController extends AbstractController
{
    public function __construct(
        private CategoryRepository $repo,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_admin_categories_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(50, (int) $request->query->get('limit', 10)));
        $search = trim($request->query->get('q', ''));
        $sort = $request->query->get('sort', 'createdAt');
        $dir = $request->query->get('dir', 'DESC');
        $showDeleted = $request->query->getBoolean('deleted');

        $qb = $this->repo->createQueryBuilder('c');

        if ($showDeleted) {
           $this->em->getFilters()->disable('softdeleteable');
           $qb->where('c.deletedAt IS NOT NULL');
        } else {
           $qb->where('c.deletedAt IS NULL');
        }

        if ($search) {
            $qb->andWhere('LOWER(c.name) LIKE LOWER(:search)')
               ->setParameter('search', "%$search%");
        }

        // Count
        $countQb = clone $qb;
        $total = $countQb->select('COUNT(c.id)')->getQuery()->getSingleScalarResult();

        // Sort
        $allowedSorts = ['name', 'createdAt', 'updatedAt'];
        if (in_array($sort, $allowedSorts)) {
            $qb->orderBy('c.' . $sort, strtoupper($dir) === 'ASC' ? 'ASC' : 'DESC');
        } else {
            $qb->orderBy('c.createdAt', 'DESC');
        }

        $items = $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
        
        // Re-enable filter if disabled
        if ($showDeleted && !$this->em->getFilters()->isEnabled('softdeleteable')) {
            $this->em->getFilters()->enable('softdeleteable');
        }

        return $this->json([
            'data' => array_map(fn(Category $c) => [
                'id' => $c->getId()->toRfc4122(),
                'name' => $c->getName(),
                'iconUrl' => $c->getIconUrl(),
                'inventoryCount' => $c->getInventoryCount(),
                'createdAt' => $c->getCreatedAt()->format('c'),
                'deletedAt' => $c->getDeletedAt()?->format('c'),
            ], $items),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit),
            ]
        ]);
    }

    #[Route('', name: 'api_admin_categories_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $name = trim($data['name'] ?? '');
        $iconUrl = trim($data['iconUrl'] ?? '');

        if (!$name) {
            return $this->json(['error' => 'Name is required'], 400);
        }

        $category = new Category();
        $category->setName($name);
        if ($iconUrl) $category->setIconUrl($iconUrl);

        $this->em->persist($category);
        $this->em->flush();

        return $this->json([
            'id' => $category->getId()->toRfc4122(),
            'message' => 'Category created'
        ], 201);
    }

    #[Route('/{id}', name: 'api_admin_categories_edit', methods: ['PUT', 'PATCH'])]
    public function edit(string $id, Request $request): JsonResponse
    {
        $category = $this->repo->find($id);
        if (!$category) throw $this->createNotFoundException();

        $data = json_decode($request->getContent(), true);
        
        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (!$name) return $this->json(['error' => 'Name cannot be empty'], 400);
            $category->setName($name);
        }
        
        if (array_key_exists('iconUrl', $data)) {
            $category->setIconUrl($data['iconUrl']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Category updated']);
    }

    #[Route('/{id}', name: 'api_admin_categories_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $category = $this->repo->find($id);
        if (!$category) throw $this->createNotFoundException();

        // Soft delete
        $this->em->remove($category);
        $this->em->flush();

        return $this->json(['message' => 'Category deleted']);
    }

    #[Route('/{id}/restore', name: 'api_admin_categories_restore', methods: ['POST'])]
    public function restore(string $id): JsonResponse
    {
        $this->em->getFilters()->disable('softdeleteable');
        $category = $this->repo->find($id);
        
        if (!$category) {
            $this->em->getFilters()->enable('softdeleteable');
            throw $this->createNotFoundException();
        }

        $category->setDeletedAt(null);
        $this->em->flush();
        $this->em->getFilters()->enable('softdeleteable');

        return $this->json(['message' => 'Category restored']);
    }

    #[Route('/{id}/permanent', name: 'api_admin_categories_permanent', methods: ['DELETE'])]
    public function permanentDelete(string $id): JsonResponse
    {
        $this->em->getFilters()->disable('softdeleteable');
        $category = $this->repo->find($id);

        if (!$category) {
            $this->em->getFilters()->enable('softdeleteable');
            throw $this->createNotFoundException();
        }

        // Validation: Check usage
        if ($category->getInventoryCount() > 0) {
            $this->em->getFilters()->enable('softdeleteable');
            return $this->json(['error' => 'Cannot permanently delete category linked to inventories. Move them first.'], 409);
        }

        // Hard Deletion via DQL to bypass listeners if needed, or strict remove
        // Just remove, since softDeleteable filter is disabled?
        // Wait, if I call remove() while filter is disabled, Doctrine might still set deletedAt?
        // No, soft-deleteable listener behavior depends on config.
        // Usually need to hard delete via DQL or specifically tell Listener.
        // Safer to use DQL DELETE.
        $this->em->createQuery('DELETE FROM App\Entity\Category c WHERE c.id = :id')
             ->setParameter('id', $category->getId())
             ->execute();

        $this->em->getFilters()->enable('softdeleteable');

        return $this->json(['message' => 'Category permanently deleted']);
    }

    #[Route('/bulk/delete', name: 'api_admin_categories_bulk_delete', methods: ['POST'])]
    public function bulkDelete(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];
        if (empty($ids)) return $this->json(['message' => 'No IDs provided'], 400);

        foreach ($ids as $id) {
            $cat = $this->repo->find($id);
            if ($cat) $this->em->remove($cat);
        }
        $this->em->flush();
        return $this->json(['message' => 'Categories deleted']);
    }
}
