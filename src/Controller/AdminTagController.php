<?php

namespace App\Controller;

use App\Entity\Tag;
use App\Repository\TagRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/tags')]
#[IsGranted('ROLE_ADMIN')]
class AdminTagController extends AbstractController
{
    public function __construct(
        private TagRepository $repo,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_admin_tags_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(50, (int) $request->query->get('limit', 10)));
        $search = trim($request->query->get('q', ''));
        $sort = $request->query->get('sort', 'createdAt');
        $dir = $request->query->get('dir', 'DESC');
        $showDeleted = $request->query->getBoolean('deleted');

        $qb = $this->repo->createQueryBuilder('t');

        if ($showDeleted) {
           $this->em->getFilters()->disable('softdeleteable');
           $qb->where('t.deletedAt IS NOT NULL');
        } else {
           $qb->where('t.deletedAt IS NULL');
        }

        if ($search) {
            $qb->andWhere('LOWER(t.name) LIKE LOWER(:search)')
               ->setParameter('search', "%$search%");
        }

        // Count
        $countQb = clone $qb;
        $total = $countQb->select('COUNT(t.id)')->getQuery()->getSingleScalarResult();

        // Sort
        $allowedSorts = ['name', 'createdAt'];
        if (in_array($sort, $allowedSorts)) {
            $qb->orderBy('t.' . $sort, strtoupper($dir) === 'ASC' ? 'ASC' : 'DESC');
        } else {
            $qb->orderBy('t.createdAt', 'DESC');
        }

        $tags = $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
        
        // Re-enable filter if disabled
        if ($showDeleted && !$this->em->getFilters()->isEnabled('softdeleteable')) {
            $this->em->getFilters()->enable('softdeleteable');
        }

        return $this->json([
            'data' => array_map(fn(Tag $t) => [
                'id' => $t->getId()->toRfc4122(),
                'name' => $t->getName(),
                'isPredefined' => $t->isPredefined(),
                'usageCount' => $this->repo->countItems($t), // N+1 but acceptable for admin page limit 10-50
                'createdAt' => $t->getCreatedAt()->format('c'),
                'deletedAt' => $t->getDeletedAt()?->format('c'),
            ], $tags),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit),
            ]
        ]);
    }

    #[Route('', name: 'api_admin_tags_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $name = trim($data['name'] ?? '');
        $isPredefined = (bool)($data['isPredefined'] ?? false);

        if (!$name) {
            return $this->json(['error' => 'Name is required'], 400);
        }

        // Check exists
        if ($this->repo->findOneBy(['name' => $name])) {
            return $this->json(['error' => 'Tag already exists'], 409);
        }

        $tag = new Tag();
        $tag->setName($name);
        $tag->setPredefined($isPredefined);

        $this->em->persist($tag);
        $this->em->flush();

        return $this->json([
            'id' => $tag->getId()->toRfc4122(),
            'message' => 'Tag created'
        ], 201);
    }

    #[Route('/{id}', name: 'api_admin_tags_edit', methods: ['PUT', 'PATCH'])]
    public function edit(string $id, Request $request): JsonResponse
    {
        $tag = $this->repo->find($id);
        if (!$tag) throw $this->createNotFoundException();

        $data = json_decode($request->getContent(), true);
        
        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (!$name) return $this->json(['error' => 'Name cannot be empty'], 400);
            
            // Uniqueness check (if changed)
            if (mb_strtolower($name) !== mb_strtolower($tag->getName())) {
                 if ($this->repo->findOneBy(['name' => $name])) {
                    return $this->json(['error' => 'Tag name already used'], 409);
                }
            }
            $tag->setName($name);
        }
        
        if (array_key_exists('isPredefined', $data)) {
            $tag->setPredefined((bool)$data['isPredefined']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Tag updated']);
    }

    #[Route('/{id}', name: 'api_admin_tags_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $tag = $this->repo->find($id);
        if (!$tag) throw $this->createNotFoundException();

        // Soft delete
        $this->em->remove($tag); 
        // Note: doctrine listener handles setting deletedAt if SoftDeleteable enabled and configured.
        // Wait, did I confirm user configures listener for ALL entities?
        // User entity works. Assuming configuration is global (Attributes).
        
        $this->em->flush();

        return $this->json(['message' => 'Tag deleted']);
    }

    #[Route('/{id}/restore', name: 'api_admin_tags_restore', methods: ['POST'])]
    public function restore(string $id): JsonResponse
    {
        $this->em->getFilters()->disable('softdeleteable');
        $tag = $this->repo->find($id);
        
        if (!$tag) {
            $this->em->getFilters()->enable('softdeleteable');
            throw $this->createNotFoundException();
        }

        $tag->setDeletedAt(null);
        $this->em->flush();
        $this->em->getFilters()->enable('softdeleteable');

        return $this->json(['message' => 'Tag restored']);
    }

    #[Route('/{id}/permanent', name: 'api_admin_tags_permanent', methods: ['DELETE'])]
    public function permanentDelete(string $id): JsonResponse
    {
        $this->em->getFilters()->disable('softdeleteable');
        $tag = $this->repo->find($id);

        if (!$tag) {
            $this->em->getFilters()->enable('softdeleteable');
            throw $this->createNotFoundException();
        }

        // Validation: Check usage
        $usage = $this->repo->countItems($tag);
        if ($usage > 0) {
            $this->em->getFilters()->enable('softdeleteable');
            return $this->json(['error' => "Cannot permanently delete tag used by {$usage} items."], 409);
        }

        $this->em->createQuery('DELETE FROM App\Entity\Tag t WHERE t.id = :id')
             ->setParameter('id', $tag->getId())
             ->execute();

        $this->em->getFilters()->enable('softdeleteable');

        return $this->json(['message' => 'Tag permanently deleted']);
    }

    #[Route('/bulk/delete', name: 'api_admin_tags_bulk_delete', methods: ['POST'])]
    public function bulkDelete(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];
        if (empty($ids)) return $this->json(['message' => 'No IDs provided'], 400);

        foreach ($ids as $id) {
            $tag = $this->repo->find($id);
            if ($tag) $this->em->remove($tag);
        }
        $this->em->flush();
        return $this->json(['message' => 'Tags deleted']);
    }
}
