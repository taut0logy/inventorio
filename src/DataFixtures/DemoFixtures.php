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
        // Get existing categories
        $categories = $manager->getRepository(Category::class)->findAll();
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
    }

    private function createUsers(ObjectManager $manager): array
    {
        $usersData = [
            // Admins
            ['email' => 'superadmin@inventorio.com', 'name' => 'Super Admin', 'roles' => ['ROLE_ADMIN'], 'theme' => 'dark'],
            
            // Regular users with different themes and locales
            ['email' => 'alice.johnson@example.com', 'name' => 'Alice Johnson', 'roles' => [], 'theme' => 'light', 'locale' => 'en'],
            ['email' => 'bob.smith@example.com', 'name' => 'Bob Smith', 'roles' => [], 'theme' => 'dark', 'locale' => 'en'],
            ['email' => 'charlie.brown@example.com', 'name' => 'Charlie Brown', 'roles' => [], 'theme' => 'light'],
            ['email' => 'diana.prince@example.com', 'name' => 'Diana Prince', 'roles' => [], 'theme' => 'dark'],
            ['email' => 'edward.stark@example.com', 'name' => 'Edward Stark', 'roles' => [], 'theme' => 'light'],
            ['email' => 'fiona.green@example.com', 'name' => 'Fiona Green', 'roles' => [], 'theme' => 'dark'],
            ['email' => 'george.wilson@example.com', 'name' => 'George Wilson', 'roles' => [], 'theme' => 'light'],
            ['email' => 'hannah.baker@example.com', 'name' => 'Hannah Baker', 'roles' => [], 'theme' => 'dark'],
            ['email' => 'ivan.petrov@example.com', 'name' => 'Ivan Petrov', 'roles' => [], 'theme' => 'light'],
            
            // Blocked user for testing
            ['email' => 'blocked.user@example.com', 'name' => 'Blocked User', 'roles' => [], 'blocked' => true],
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
        $inventoriesData = [
            // Public inventories
            [
                'title' => 'Tech Gadgets Collection',
                'description' => "A comprehensive collection of **technology gadgets** including smartphones, tablets, and accessories.\n\n- Latest models\n- Verified specifications\n- Price tracking",
                'isPublic' => true,
                'category' => 'Electronics',
                'tags' => ['popular', 'new', 'premium'],
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Brand', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Model', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Price ($)', 'visible' => true],
                    'customNumber2' => ['enabled' => true, 'label' => 'Stock', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'In Stock', 'visible' => true],
                ],
                'idConfig' => [
                    'elements' => [
                        ['type' => 'fixed', 'value' => 'TECH-'],
                        ['type' => 'sequence', 'minDigits' => 4],
                    ]
                ],
            ],
            [
                'title' => 'Office Furniture Catalog',
                'description' => "Complete office furniture inventory for the main building.\n\nIncludes desks, chairs, and storage units.",
                'isPublic' => true,
                'category' => 'Furniture',
                'tags' => ['certified', 'warranty'],
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Location', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Condition', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Purchase Price', 'visible' => true],
                ],
            ],
            [
                'title' => 'Vehicle Fleet Management',
                'description' => "Company vehicle fleet tracking system.\n\n| Vehicle Type | Count |\n|--------------|-------|\n| Sedan | 5 |\n| SUV | 3 |\n| Van | 2 |",
                'isPublic' => true,
                'category' => 'Vehicles',
                'tags' => ['certified', 'premium'],
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'License Plate', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Make/Model', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Mileage', 'visible' => true],
                    'customString3' => ['enabled' => true, 'label' => 'Assigned To', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'Available', 'visible' => true],
                ],
                'idConfig' => [
                    'elements' => [
                        ['type' => 'fixed', 'value' => 'VH-'],
                        ['type' => 'date', 'format' => 'YYYY'],
                        ['type' => 'fixed', 'value' => '-'],
                        ['type' => 'sequence', 'minDigits' => 3],
                    ]
                ],
            ],
            [
                'title' => 'Rare Book Collection',
                'description' => "Personal collection of rare and antique books.\n\nFirst editions and signed copies.",
                'isPublic' => true,
                'category' => 'Books & Media',
                'tags' => ['vintage', 'collectibles', 'limited'],
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Author', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Publisher', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Year Published', 'visible' => true],
                    'customNumber2' => ['enabled' => true, 'label' => 'Estimated Value', 'visible' => true],
                    'customText1' => ['enabled' => true, 'label' => 'Notes', 'visible' => false],
                ],
            ],
            // Private inventories
            [
                'title' => 'Personal Collectibles',
                'description' => "My private collection of memorabilia and collectibles.",
                'isPublic' => false,
                'category' => 'Collectibles',
                'tags' => ['vintage', 'limited'],
                'sharedWith' => [1, 2], // Index of users to share with
            ],
            [
                'title' => 'Medical Equipment Inventory',
                'description' => "Hospital equipment tracking for Ward A.\n\n> Critical equipment must be maintained monthly.",
                'isPublic' => false,
                'category' => 'Medical Supplies',
                'tags' => ['certified', 'premium'],
                'customFields' => [
                    'customString1' => ['enabled' => true, 'label' => 'Serial Number', 'visible' => true],
                    'customString2' => ['enabled' => true, 'label' => 'Department', 'visible' => true],
                    'customNumber1' => ['enabled' => true, 'label' => 'Calibration Date', 'visible' => true],
                    'customBool1' => ['enabled' => true, 'label' => 'Requires Maintenance', 'visible' => true],
                ],
                'sharedWith' => [3, 4, 5],
            ],
            [
                'title' => 'Workshop Tools',
                'description' => "Power tools and hand tools for the workshop.",
                'isPublic' => true,
                'category' => 'Tools & Equipment',
                'tags' => ['popular'],
            ],
            [
                'title' => 'Kitchen Supplies',
                'description' => "Restaurant kitchen inventory management.",
                'isPublic' => true,
                'category' => 'Food & Beverages',
                'tags' => ['new', 'eco-friendly'],
            ],
        ];

        $inventories = [];
        $categoryRepo = $manager->getRepository(Category::class);
        $tagRepo = $manager->getRepository(Tag::class);

        foreach ($inventoriesData as $i => $data) {
            $inventory = new Inventory();
            $inventory->setTitle($data['title']);
            $inventory->setDescription($data['description']);
            $inventory->setPublic($data['isPublic']);
            
            // Set category
            $category = $categoryRepo->findOneBy(['name' => $data['category']]);
            if ($category) {
                $inventory->setCategory($category);
            }
            
            // Add tags
            if (!empty($data['tags'])) {
                foreach ($data['tags'] as $tagName) {
                    $tag = $tagRepo->findOneBy(['name' => $tagName]);
                    if ($tag) {
                        $inventory->addTag($tag);
                    }
                }
            }
            
            // Set custom fields config
            if (!empty($data['customFields'])) {
                $inventory->setCustomFieldsConfig($data['customFields']);
            }
            
            // Set ID generation config
            if (!empty($data['idConfig'])) {
                $inventory->setIdGenerationConfig($data['idConfig']);
            }
            
            // Assign creator (rotate through users, skip admin)
            $creatorIndex = ($i % (count($users) - 1)) + 1;
            $inventory->setCreator($users[$creatorIndex]);
            
            // Share with specified users
            if (!empty($data['sharedWith'])) {
                foreach ($data['sharedWith'] as $userIndex) {
                    if (isset($users[$userIndex])) {
                        $inventory->addSharedWith($users[$userIndex]);
                    }
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
            // Tech Gadgets items (inventory 0)
            [
                'inventory' => 0,
                'items' => [
                    ['customId' => 'TECH-0001', 'customString1' => 'Apple', 'customString2' => 'iPhone 15 Pro', 'customNumber1' => 999.99, 'customNumber2' => 50, 'customBool1' => true, 'tags' => ['new', 'premium']],
                    ['customId' => 'TECH-0002', 'customString1' => 'Samsung', 'customString2' => 'Galaxy S24 Ultra', 'customNumber1' => 1199.99, 'customNumber2' => 35, 'customBool1' => true, 'tags' => ['new']],
                    ['customId' => 'TECH-0003', 'customString1' => 'Sony', 'customString2' => 'WH-1000XM5', 'customNumber1' => 349.99, 'customNumber2' => 100, 'customBool1' => true, 'tags' => ['popular']],
                    ['customId' => 'TECH-0004', 'customString1' => 'Apple', 'customString2' => 'MacBook Pro 16"', 'customNumber1' => 2499.99, 'customNumber2' => 15, 'customBool1' => true, 'tags' => ['premium']],
                    ['customId' => 'TECH-0005', 'customString1' => 'Dell', 'customString2' => 'XPS 15', 'customNumber1' => 1799.99, 'customNumber2' => 25, 'customBool1' => true],
                    ['customId' => 'TECH-0006', 'customString1' => 'Google', 'customString2' => 'Pixel 8 Pro', 'customNumber1' => 899.99, 'customNumber2' => 0, 'customBool1' => false, 'tags' => ['discontinued']],
                    ['customId' => 'TECH-0007', 'customString1' => 'Logitech', 'customString2' => 'MX Master 3S', 'customNumber1' => 99.99, 'customNumber2' => 200, 'customBool1' => true, 'tags' => ['popular']],
                    ['customId' => 'TECH-0008', 'customString1' => 'Apple', 'customString2' => 'iPad Pro 12.9"', 'customNumber1' => 1099.99, 'customNumber2' => 40, 'customBool1' => true],
                ],
            ],
            // Office Furniture items (inventory 1)
            [
                'inventory' => 1,
                'items' => [
                    ['customId' => 'FURN-001', 'customString1' => 'Room 101', 'customString2' => 'Excellent', 'customNumber1' => 450.00],
                    ['customId' => 'FURN-002', 'customString1' => 'Room 102', 'customString2' => 'Good', 'customNumber1' => 350.00],
                    ['customId' => 'FURN-003', 'customString1' => 'Room 103', 'customString2' => 'Fair', 'customNumber1' => 200.00],
                    ['customId' => 'FURN-004', 'customString1' => 'Lobby', 'customString2' => 'Excellent', 'customNumber1' => 800.00],
                    ['customId' => 'FURN-005', 'customString1' => 'Conference A', 'customString2' => 'Excellent', 'customNumber1' => 1500.00],
                ],
            ],
            // Vehicle Fleet items (inventory 2)
            [
                'inventory' => 2,
                'items' => [
                    ['customId' => 'VH-2024-001', 'customString1' => 'ABC-1234', 'customString2' => 'Toyota Camry', 'customNumber1' => 45000, 'customString3' => 'Sales Team', 'customBool1' => true],
                    ['customId' => 'VH-2024-002', 'customString1' => 'XYZ-5678', 'customString2' => 'Honda CR-V', 'customNumber1' => 32000, 'customString3' => 'Management', 'customBool1' => false],
                    ['customId' => 'VH-2024-003', 'customString1' => 'DEF-9012', 'customString2' => 'Ford Transit', 'customNumber1' => 78000, 'customString3' => 'Logistics', 'customBool1' => true],
                ],
            ],
            // Rare Books items (inventory 3)
            [
                'inventory' => 3,
                'items' => [
                    ['customId' => 'BOOK-001', 'customString1' => 'Charles Dickens', 'customString2' => 'Chapman & Hall', 'customNumber1' => 1859, 'customNumber2' => 15000, 'customText1' => 'First edition of A Tale of Two Cities', 'tags' => ['vintage', 'limited']],
                    ['customId' => 'BOOK-002', 'customString1' => 'Jane Austen', 'customString2' => 'T. Egerton', 'customNumber1' => 1813, 'customNumber2' => 50000, 'customText1' => 'Pride and Prejudice first edition', 'tags' => ['vintage', 'limited']],
                    ['customId' => 'BOOK-003', 'customString1' => 'J.R.R. Tolkien', 'customString2' => 'Allen & Unwin', 'customNumber1' => 1954, 'customNumber2' => 8000, 'customText1' => 'Lord of the Rings first printing', 'tags' => ['vintage']],
                ],
            ],
        ];

        $items = [];
        $tagRepo = $manager->getRepository(Tag::class);
        $seq = 1;

        foreach ($itemsData as $group) {
            $inventory = $inventories[$group['inventory']];
            foreach ($group['items'] as $itemData) {
                $item = new Item();
                $item->setInventory($inventory);
                $item->setCustomId($itemData['customId']);
                $item->setSequenceNumber($seq++);
                
                // Set creator (rotate through users)
                $creatorIndex = ($seq % (count($users) - 1)) + 1;
                $item->setCreatedBy($users[$creatorIndex]);
                
                // Set custom field values
                if (isset($itemData['customString1'])) $item->setCustomString1Value($itemData['customString1']);
                if (isset($itemData['customString2'])) $item->setCustomString2Value($itemData['customString2']);
                if (isset($itemData['customString3'])) $item->setCustomString3Value($itemData['customString3']);
                if (isset($itemData['customNumber1'])) $item->setCustomNumber1Value($itemData['customNumber1']);
                if (isset($itemData['customNumber2'])) $item->setCustomNumber2Value($itemData['customNumber2']);
                if (isset($itemData['customText1'])) $item->setCustomText1Value($itemData['customText1']);
                if (isset($itemData['customBool1'])) $item->setCustomBool1Value($itemData['customBool1']);
                
                // Add tags
                if (!empty($itemData['tags'])) {
                    foreach ($itemData['tags'] as $tagName) {
                        $tag = $tagRepo->findOneBy(['name' => $tagName]);
                        if ($tag) {
                            $item->addTag($tag);
                        }
                    }
                }
                
                $manager->persist($item);
                $items[] = $item;
            }
        }

        return $items;
    }

    private function createComments(ObjectManager $manager, array $inventories, array $users): void
    {
        $commentsData = [
            [
                'inventory' => 0,
                'comments' => [
                    ['user' => 1, 'content' => 'Great collection! The iPhone 15 Pro specs look amazing.'],
                    ['user' => 2, 'content' => 'Any plans to add the new Samsung Galaxy Z Fold?'],
                    ['user' => 1, 'content' => 'Yes, we\'re adding it next week!'],
                    ['user' => 3, 'content' => 'The prices seem competitive. Good job maintaining this inventory.'],
                    ['user' => 4, 'content' => 'Could you add a field for warranty information?'],
                ],
            ],
            [
                'inventory' => 2,
                'comments' => [
                    ['user' => 2, 'content' => 'The Ford Transit needs maintenance soon based on mileage.'],
                    ['user' => 5, 'content' => 'I\'ll schedule it for next Monday.'],
                ],
            ],
            [
                'inventory' => 3,
                'comments' => [
                    ['user' => 6, 'content' => 'Amazing collection! The Pride and Prejudice first edition is incredible.'],
                    ['user' => 7, 'content' => 'Are you considering selling any of these?'],
                    ['user' => 1, 'content' => 'Not at the moment, but I\'m always open to trades for other rare editions.'],
                ],
            ],
        ];

        foreach ($commentsData as $group) {
            $inventory = $inventories[$group['inventory']];
            foreach ($group['comments'] as $commentData) {
                $comment = new Comment();
                $comment->setInventory($inventory);
                $comment->setUser($users[$commentData['user']]);
                $comment->setContent($commentData['content']);
                $manager->persist($comment);
            }
        }
    }

    private function createLikes(ObjectManager $manager, array $items, array $users): void
    {
        // Randomly distribute likes across items
        foreach ($items as $index => $item) {
            // Each item gets likes from a random subset of users
            $numLikes = random_int(0, min(count($users) - 1, 5));
            $likedByIndices = array_rand(range(1, count($users) - 1), max(1, $numLikes));
            
            if (!is_array($likedByIndices)) {
                $likedByIndices = [$likedByIndices];
            }
            
            foreach ($likedByIndices as $userIndex) {
                $item->addLikedBy($users[$userIndex + 1]); // +1 to skip admin
            }
        }
    }
}
