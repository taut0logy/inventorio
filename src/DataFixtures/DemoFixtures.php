<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Comment;
use App\Entity\Inventory;
use App\Entity\Item;
use App\Entity\Tag;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Demo fixtures with diverse sample data.
 * Run with: php bin/console doctrine:fixtures:load --group=demo --append
 */
class DemoFixtures extends Fixture implements FixtureGroupInterface, DependentFixtureInterface
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public static function getGroups(): array
    {
        return ['demo'];
    }

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        // Get existing categories and tags
        $categoryRepo = $manager->getRepository(Category::class);
        $categories = $categoryRepo->findAll();
        $tags = $manager->getRepository(Tag::class)->findAll();

        // Create diverse users
        $users = $this->createUsers($manager);
        $manager->flush();

        // Create inventories with items
        $inventories = $this->createInventories($manager, $users, $categories, $tags);
        $manager->flush();

        // Create items for each inventory
        $items = $this->createItems($manager, $inventories, $users, $tags);
        $manager->flush();

        // Create comments
        $this->createComments($manager, $inventories, $users);
        $manager->flush();

        // Create likes
        $this->createLikes($manager, $items, $users);
        $manager->flush();

        // Create Activity Logs
        $this->createActivities($manager, $inventories, $users, $items);
        $manager->flush();
    }

    private function createUsers(ObjectManager $manager): array
    {
        $usersData = [
            // Admin
            ['email' => 'superadmin@inventorio.com', 'name' => 'Sara Connor', 'roles' => ['ROLE_ADMIN'], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara'],
            
            // Power Users
            ['email' => 'alex.chen@inventorio.com', 'name' => 'Alex Chen', 'roles' => [], 'theme' => 'dark', 'locale' => 'en', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'],
            ['email' => 'maria.garcia@inventorio.com', 'name' => 'Maria Garcia', 'roles' => [], 'theme' => 'light', 'locale' => 'es', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'],
            
            // Regular Users
            ['email' => 'john.doe@example.com', 'name' => 'John Doe', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'],
            ['email' => 'jane.smith@example.com', 'name' => 'Jane Smith', 'roles' => [], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'],
            ['email' => 'mike.ross@example.com', 'name' => 'Mike Ross', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'],
            ['email' => 'rachel.zane@example.com', 'name' => 'Rachel Zane', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel'],
            ['email' => 'harvey.specter@example.com', 'name' => 'Harvey Specter', 'roles' => [], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harvey'],
            ['email' => 'louis.litt@example.com', 'name' => 'Louis Litt', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Louis'],
            
            // Blocked User
            ['email' => 'blocked.user@example.com', 'name' => 'Banned User', 'roles' => [], 'blocked' => true, 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Banned'],
        ];

        $users = [];
        foreach ($usersData as $data) {
            $user = new User();
            $user->setEmail($data['email']);
            $user->setName($data['name']);
            $user->setPassword($this->passwordHasher->hashPassword($user, 'password123'));
            $user->setRoles($data['roles']);
            $user->setEmailVerified(true);
            $user->setTheme($data['theme'] ?? 'light');
            $user->setLocale($data['locale'] ?? 'en');
            $user->setAvatarUrl($data['avatar'] ?? null);
            if (!empty($data['blocked'])) {
                $user->setBlocked(true);
            }
            $manager->persist($user);
            $users[] = $user;
        }

        return $users;
    }

    private function createInventories(ObjectManager $manager, array $users, array $categories, array $tags): array
    {
        $categoryMap = [];
        foreach ($categories as $cat) {
            $categoryMap[$cat->getName()] = $cat;
        }

        $tagMap = [];
        foreach ($tags as $tag) {
            $tagMap[$tag->getName()] = $tag;
        }

        $inventoriesData = [
            // 1. Electronics (Public, Rich Fields)
            [
                'title' => 'Tech Gadgets 2024',
                'description' => "Our master tracking list for all current-gen tech gadgets. \n\n### Categories covered:\n- Smartphones\n- Laptops\n- Wearables\n\n> Updated weekly with pricing.",
                'isPublic' => true,
                'category' => 'Electronics',
                'tags' => ['popular', 'new', 'premium', 'warranty'],
                'creator' => 1, // Alex
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Brand', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Model', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Price ($)', 'visible' => true],
                    'customNumber2' => ['enabled' => true, 'label' => 'Stock Qty', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'In Stock', 'visible' => true],
                    'customLink1' => ['enabled' => true, 'label' => 'Product Page', 'visible' => false],
                ],
                'idConfig' => [
                    'elements' => [
                        ['type' => 'fixed', 'value' => 'TECH-'],
                        ['type' => 'sequence', 'minDigits' => 4],
                    ]
                ],
            ],
            // 2. Office Furniture (Public, Simple)
            [
                'title' => 'HQ Furniture Asset Log',
                'description' => "Inventory of all furniture in the Head Quarters building.",
                'isPublic' => true,
                'category' => 'Furniture',
                'tags' => ['old', 'used'],
                'creator' => 2, // Maria
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Location (Room)', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Condition', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Asset Value', 'visible' => true],
                ],
            ],
             // 3. Vehicles (Public, Date ID)
            [
                'title' => 'Logistics Fleet',
                'description' => "Company vehicles tracking.",
                'isPublic' => true,
                'category' => 'Vehicles',
                'tags' => ['certified', 'premium'],
                'creator' => 0, // Admin
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'License Plate', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Driver', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Mileage', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'Service Due', 'visible' => true],
                ],
                'idConfig' => [
                    'elements' => [
                        ['type' => 'fixed', 'value' => 'FLT-'],
                        ['type' => 'date', 'format' => 'YYYY'],
                        ['type' => 'fixed', 'value' => '-'],
                        ['type' => 'sequence', 'minDigits' => 3],
                    ]
                ],
            ],
            // 4. Rare Books (Private, Shared)
            [
                'title' => 'Ancient Manuscripts',
                'description' => "Restricted access collection of rare manuscripts.",
                'isPublic' => false,
                'category' => 'Books & Media',
                'tags' => ['vintage', 'limited', 'protect'],
                'creator' => 7, // Harvey
                'sharedWith' => [1, 5, 8], // Alex, Mike, Louis
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Author', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Origin', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Year', 'visible' => true],
                    'customNumber2' => ['enabled' => true, 'label' => 'Est. Value', 'visible' => true],
                ],
            ],
            // 5. Medical Supplies (Private, Shared)
            [
                'title' => 'Lab Equipment',
                'description' => "Sensitive lab equipment tracking.",
                'isPublic' => false,
                'category' => 'Medical Supplies',
                'tags' => ['certified'],
                'creator' => 4, // Jane
                'sharedWith' => [3, 2], // John, Maria
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Serial', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'Calibrated', 'visible' => true],
                ],
            ],
            // 6. Food (Public)
            [
                'title' => 'Pantry Stock',
                'description' => "Kitchen supplies and dry goods.",
                'isPublic' => true,
                'category' => 'Food & Beverages',
                'tags' => ['eco-friendly'],
                'creator' => 6, // Rachel
            ],
            // 7. Tools (Public)
            [
                'title' => 'Workshop 7 Tools',
                'description' => "Tools assigned to workshop 7.",
                'isPublic' => true,
                'category' => 'Tools & Equipment',
                'tags' => ['used', 'heavy'],
                'creator' => 5, // Mike
            ],
             // 8. Clothing (Private, Personal)
            [
                'title' => 'Vintage Wardrobe',
                'description' => "My personal vintage clothing collection.",
                'isPublic' => false,
                'category' => 'Clothing & Accessories',
                'tags' => ['vintage', 'fashion'],
                'creator' => 3, // John
            ]
        ];

        $inventories = [];
        foreach ($inventoriesData as $data) {
            $inventory = new Inventory();
            $inventory->setTitle($data['title']);
            $inventory->setDescription($data['description'] ?? '');
            $inventory->setPublic($data['isPublic']);
            
            if (isset($categoryMap[$data['category']])) {
                $inventory->setCategory($categoryMap[$data['category']]);
            }

            if (!empty($data['tags'])) {
                foreach ($data['tags'] as $tagName) {
                    if (isset($tagMap[$tagName])) {
                        $inventory->addTag($tagMap[$tagName]);
                    }
                }
            }

            if (!empty($data['customFields'])) {
                $inventory->setCustomFieldsConfig($data['customFields']);
            }
            if (!empty($data['idConfig'])) {
                $inventory->setIdGenerationConfig($data['idConfig']);
            }

            $inventory->setCreator($users[$data['creator']]);
            
            if (!empty($data['sharedWith'])) {
                foreach ($data['sharedWith'] as $uIndex) {
                    $inventory->addSharedWith($users[$uIndex]);
                }
            }

            $manager->persist($inventory);
            $inventories[] = $inventory;
        }

        return $inventories;
    }

    private function createItems(ObjectManager $manager, array $inventories, array $users, array $tags): array
    {
        $itemsData = [
            // Inventory 0: Tech
            [
                'inv' => 0,
                'items' => [
                    ['iPhone 15 Pro', 'Apple', 999, 50, true, 'https://www.apple.com/iphone', ['new', 'popular']],
                    ['Galaxy S24 Ultra', 'Samsung', 1199, 32, true, 'https://www.samsung.com', ['new', 'popular']],
                    ['Pixel 8 Pro', 'Google', 899, 15, true, 'https://store.google.com', []],
                    ['MacBook Air M3', 'Apple', 1099, 20, true, null, ['premium']],
                    ['XPS 15', 'Dell', 1499, 5, false, null, []],
                    ['ThinkPad X1', 'Lenovo', 1299, 10, true, null, ['durable']],
                    ['iPad Air', 'Apple', 599, 45, true, null, []],
                    ['Galaxy Tab S9', 'Samsung', 799, 25, true, null, []],
                    ['Sony WH-1000XM5', 'Sony', 349, 100, true, null, ['audio']],
                    ['AirPods Pro', 'Apple', 249, 150, true, null, ['audio', 'small']],
                ]
            ],
            // Inventory 1: Furniture
            [
                'inv' => 1,
                'items' => [
                    ['Herman Miller Aeron', 'Exec Office', 1200, 'Good'],
                    ['Steelcase Leap', 'Room 202', 900, 'Excellent'],
                    ['Basic Task Chair', 'Cubicles', 150, 'Fair'],
                    ['Oak Desk', 'Room 101', 500, 'Good'],
                    ['Standing Desk', 'Room 205', 400, 'New'],
                ]
            ],
             // Inventory 2: Vehicles
             [
                'inv' => 2,
                'items' => [
                    ['Ford F-150', 'Mike', 45000, false],
                    ['Toyota Camry', 'Sales', 25000, true],
                    ['Honda Civic', 'Pool', 15000, true],
                    ['Chevy Bolt', 'Eco Team', 10000, false],
                ]
            ]
        ];

        $items = [];
        $repo = $manager->getRepository(Tag::class);

        foreach ($itemsData as $group) {
            $inventory = $inventories[$group['inv']];
            $seq = 1;
            
            foreach ($group['items'] as $rawItem) {
                $item = new Item();
                $item->setInventory($inventory);
                $item->setSequenceNumber($seq++);
                
                // Construct Custom ID (Simplified logic for fixtures)
                // In real app, we'd use the generator service. Here we mimic it.
                $prefix = $group['inv'] === 0 ? 'TECH-' : ($group['inv'] === 2 ? 'FLT-' . date('Y') . '-' : 'ITEM-');
                $idVal = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
                $item->setCustomId($idVal);

                // Assign varied creator
                $item->setCreatedBy($users[array_rand($users)]);

                // Map fields based on inventory type
                if ($group['inv'] === 0) {
                     // Tech: Name, Brand, Price, Stock, InStock, Link, Tags
                     $item->setCustomString2Value($rawItem[0]); // Model
                     $item->setCustomString1Value($rawItem[1]); // Brand
                     $item->setCustomNumber1Value($rawItem[2]); // Price
                     $item->setCustomNumber2Value($rawItem[3]); // Stock
                     $item->setCustomBool1Value($rawItem[4]);   // InStock
                     $item->setCustomLink1Value($rawItem[5]);   // Link
                     
                     if (!empty($rawItem[6])) {
                         foreach ($rawItem[6] as $tName) {
                             $t = $repo->findOneBy(['name' => $tName]);
                             if ($t) $item->addTag($t);
                         }
                     }
                } elseif ($group['inv'] === 1) {
                    // Furniture: Name, Loc, Price, Cond
                    $item->setCustomString1Value($rawItem[1]); // Location
                    $item->setCustomString2Value($rawItem[3]); // Condition
                    $item->setCustomNumber1Value($rawItem[2]); // Value
                     // We use the raw name somewhere? Maybe Text1? Or just imply it's known.
                     // The fixture logic for ID gen expects to display something. 
                     // Let's put Name in Text1 for filtering if needed, though config doesn't show it.
                } elseif ($group['inv'] === 2) {
                    // Vehicles
                    $item->setCustomString1Value('XYZ-' . rand(100, 999)); // License
                    $item->setCustomString2Value($rawItem[1]); // Driver
                    $item->setCustomNumber1Value($rawItem[2]); // Mileage
                    $item->setCustomBool1Value($rawItem[3]); // Service Due
                }

                $manager->persist($item);
                $items[] = $item;
            }
        }

        // Add dummy items to other inventories to avoid emptiness
        for ($i = 3; $i < count($inventories); $i++) {
            for ($k = 1; $k <= 5; $k++) {
                $item = new Item();
                $item->setInventory($inventories[$i]);
                $item->setCustomId('GEN-' . $i . '-' . sprintf('%03d', $k));
                $item->setSequenceNumber($k);
                $item->setCreatedBy($users[array_rand($users)]);
                $item->setCustomString1Value('Sample Item ' . $k);
                $manager->persist($item);
                $items[] = $item;
            }
        }

        return $items;
    }

    private function createComments(ObjectManager $manager, array $inventories, array $users): void
    {
        $messages = [
            "Does this need maintenance?",
            "I checked this yesterday, looks good.",
            "Can we order more of these?",
            "The price seems wrongly listed.",
            "Updated the stock count.",
            "Reserved for project Beta.",
            "Missing the power cord.",
            "Excellent condition!",
            "Who is responsible for this asset?",
            "Verification complete."
        ];

        // Random comments on random inventories
        foreach ($inventories as $inv) {
            if (rand(0, 1) === 1) { // 50% chance of comments
                for ($j = 0; $j < rand(1, 5); $j++) {
                    $comment = new Comment();
                    $comment->setInventory($inv);
                    $comment->setUser($users[array_rand($users)]);
                    $comment->setContent($messages[array_rand($messages)]);
                    $comment->setCreatedAt(new \DateTime('-' . rand(1, 100) . ' hours'));
                    $manager->persist($comment);
                }
            }
        }
    }

    private function createLikes(ObjectManager $manager, array $items, array $users): void
    {
        foreach ($items as $item) {
            if (rand(0, 2) === 0) { // 33% chance of likes
                $count = rand(1, 5);
                $keys = array_rand($users, min($count, count($users)));
                if (!is_array($keys)) $keys = [$keys];
                
                foreach ($keys as $k) {
                    $item->addLikedBy($users[$k]);
                }
            }
        }
    }

    private function createActivities(ObjectManager $manager, array $inventories, array $users, array $items): void
    {
        // Activity Types: view, like, item_add, item_edit, item_delete, inventory_edit
        // Access types are auto-generated by listeners, but we can simulate logs.
        // Actually, we can just instantiate Activity entity.

        foreach ($inventories as $inv) {
            // Some views
            for ($k=0; $k < rand(5, 20); $k++) {
                $act = new \App\Entity\Activity();
                $act->setInventory($inv);
                $act->setUser($users[array_rand($users)]);
                $act->setType('view');
                $act->setCreatedAt(new \DateTime('-' . rand(1, 14) . ' days'));
                $manager->persist($act);
            }

            // Some Item Adds (simulate history)
            for ($k=0; $k < rand(1, 3); $k++) {
                $act = new \App\Entity\Activity();
                $act->setInventory($inv);
                $act->setUser($inv->getCreator());
                $act->setType('item_add');
                $act->setCreatedAt(new \DateTime('-' . rand(15, 30) . ' days'));
                $act->setMetadata(['itemId' => '?', 'customId' => 'HISTORY-ITEM']);
                $manager->persist($act);
            }
        }
    }
}
