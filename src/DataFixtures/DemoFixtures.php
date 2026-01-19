<?php

namespace App\DataFixtures;

use App\Entity\Activity;
use App\Entity\Category;
use App\Entity\Comment;
use App\Entity\Inventory;
use App\Entity\InventoryField;
use App\Entity\Item;
use App\Entity\Tag;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Demo fixtures with diverse sample data using EAV structure.
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

        // Create inventories with fields
        $inventories = $this->createInventories($manager, $users, $categories, $tags);
        $manager->flush();

        // Create items for each inventory
        $items = $this->createItems($manager, $inventories, $users, $tags);
        $manager->flush();

        // Create comments
        $this->createComments($manager, $inventories, $users);
        $manager->flush();

        // Create likes
        $this->createLikes($items, $users);
        $manager->flush();

        // Create Activity Logs
        $this->createActivities($manager, $inventories, $users);
        $manager->flush();
    }

    private function createUsers(ObjectManager $manager): array
    {
        $usersData = [
            ['email' => 'superadmin@inventorio.com', 'name' => 'Sara Connor', 'roles' => ['ROLE_ADMIN'], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara'],
            ['email' => 'alex.chen@inventorio.com', 'name' => 'Alex Chen', 'roles' => [], 'theme' => 'dark', 'locale' => 'en', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'],
            ['email' => 'maria.garcia@inventorio.com', 'name' => 'Maria Garcia', 'roles' => [], 'theme' => 'light', 'locale' => 'es', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'],
            ['email' => 'john.doe@example.com', 'name' => 'John Doe', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'],
            ['email' => 'jane.smith@example.com', 'name' => 'Jane Smith', 'roles' => [], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'],
            ['email' => 'mike.ross@example.com', 'name' => 'Mike Ross', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'],
            ['email' => 'rachel.zane@example.com', 'name' => 'Rachel Zane', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel'],
            ['email' => 'harvey.specter@example.com', 'name' => 'Harvey Specter', 'roles' => [], 'theme' => 'dark', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harvey'],
            ['email' => 'louis.litt@example.com', 'name' => 'Louis Litt', 'roles' => [], 'theme' => 'light', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Louis'],
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

    private function createField(Inventory $inventory, string $type, string $label, int $position, array $options = []): InventoryField
    {
        $field = new InventoryField();
        $field->setInventory($inventory);
        $field->setType($type);
        $field->setLabel($label);
        $field->setPosition($position);
        $field->setHidden($options['hidden'] ?? false);
        $field->setRequired($options['required'] ?? false);
        $field->setRegex($options['regex'] ?? null);
        $field->setMin($options['min'] ?? null);
        $field->setMax($options['max'] ?? null);
        $field->setOptions($options['options'] ?? null);
        $field->setDescription($options['description'] ?? null);
        return $field;
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
            // 0. Electronics (Public, Rich Fields)
            [
                'title' => 'Tech Gadgets 2024',
                'description' => "Our master tracking list for all current-gen tech gadgets.\n\n### Categories covered:\n- Smartphones\n- Laptops\n- Wearables\n\n> Updated weekly with pricing.",
                'isPublic' => true,
                'category' => 'Electronics',
                'tags' => ['popular', 'new', 'premium', 'warranty'],
                'creator' => 1,
                'fields' => [
                    ['type' => 'string', 'label' => 'Brand'],
                    ['type' => 'string', 'label' => 'Model'],
                    ['type' => 'number', 'label' => 'Price ($)', 'min' => 0],
                    ['type' => 'number', 'label' => 'Stock Qty', 'min' => 0],
                    ['type' => 'boolean', 'label' => 'In Stock'],
                    ['type' => 'link', 'label' => 'Product Page', 'hidden' => true],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'TECH-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 1. Office Furniture (Public, Simple)
            [
                'title' => 'HQ Furniture Asset Log',
                'description' => "Inventory of all furniture in the Head Quarters building.",
                'isPublic' => true,
                'category' => 'Furniture',
                'tags' => ['used'],
                'creator' => 2,
                'fields' => [
                    ['type' => 'string', 'label' => 'Item Name'],
                    ['type' => 'string', 'label' => 'Location (Room)'],
                    ['type' => 'select', 'label' => 'Condition', 'options' => ['New', 'Excellent', 'Good', 'Fair', 'Poor']],
                    ['type' => 'number', 'label' => 'Asset Value ($)', 'min' => 0],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'FURN-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 2. Vehicles (Public, Date ID)
            [
                'title' => 'Logistics Fleet',
                'description' => "Company vehicles tracking.",
                'isPublic' => true,
                'category' => 'Vehicles',
                'tags' => ['certified', 'premium'],
                'creator' => 0,
                'fields' => [
                    ['type' => 'string', 'label' => 'Vehicle Model'],
                    ['type' => 'string', 'label' => 'License Plate'],
                    ['type' => 'string', 'label' => 'Assigned Driver'],
                    ['type' => 'number', 'label' => 'Mileage', 'min' => 0],
                    ['type' => 'boolean', 'label' => 'Service Due'],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'FLT-'], ['type' => 'date', 'format' => 'YYYY'], ['type' => 'fixed', 'value' => '-'], ['type' => 'sequence', 'minDigits' => 3]]],
            ],
            // 3. Rare Books (Private, Shared)
            [
                'title' => 'Ancient Manuscripts',
                'description' => "Restricted access collection of rare manuscripts.",
                'isPublic' => false,
                'category' => 'Books & Media',
                'tags' => ['vintage', 'limited'],
                'creator' => 7,
                'sharedWith' => [1, 5, 8],
                'fields' => [
                    ['type' => 'string', 'label' => 'Title'],
                    ['type' => 'string', 'label' => 'Author'],
                    ['type' => 'string', 'label' => 'Origin'],
                    ['type' => 'number', 'label' => 'Year', 'min' => 0],
                    ['type' => 'number', 'label' => 'Est. Value ($)', 'min' => 0],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'MS-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 4. Medical Supplies (Private, Shared)
            [
                'title' => 'Lab Equipment',
                'description' => "Sensitive lab equipment tracking.",
                'isPublic' => false,
                'category' => 'Medical Supplies',
                'tags' => ['certified'],
                'creator' => 4,
                'sharedWith' => [3, 2],
                'fields' => [
                    ['type' => 'string', 'label' => 'Equipment Name'],
                    ['type' => 'string', 'label' => 'Serial Number'],
                    ['type' => 'boolean', 'label' => 'Calibrated'],
                    ['type' => 'string', 'label' => 'Last Calibration Date'],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'LAB-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 5. Conference Attendees (Public, Validation showcase)
            [
                'title' => 'Conference Attendees 2024',
                'description' => "Registration list for the **Annual Tech Summit**. Uses extensive field validation.",
                'isPublic' => true,
                'category' => 'Other',
                'creator' => 1,
                'fields' => [
                    ['type' => 'string', 'label' => 'Full Name', 'required' => true],
                    ['type' => 'string', 'label' => 'Email', 'required' => true, 'regex' => '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', 'description' => 'Official work email'],
                    ['type' => 'string', 'label' => 'Company'],
                    ['type' => 'number', 'label' => 'Age', 'min' => 18, 'max' => 99],
                    ['type' => 'select', 'label' => 'Dietary Preference', 'options' => ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'], 'required' => true],
                    ['type' => 'boolean', 'label' => 'VIP Access'],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'ATT-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 6. Software Licenses (Private, Regex Heavy)
            [
                'title' => 'Software Licenses',
                'description' => "Tracking for company software licenses and keys.",
                'isPublic' => false,
                'category' => 'Electronics',
                'tags' => ['premium', 'certified'],
                'creator' => 0, // Admin
                'fields' => [
                    ['type' => 'string', 'label' => 'Software Name', 'required' => true],
                    ['type' => 'string', 'label' => 'License Key', 'required' => true, 'regex' => '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', 'description' => 'Format: XXXX-XXXX-XXXX-XXXX'],
                    ['type' => 'select', 'label' => 'Type', 'options' => ['Subscription', 'Perpetual', 'Open Source']],
                    ['type' => 'string', 'label' => 'Seat Count', 'regex' => '^[0-9]+$'],
                    ['type' => 'link', 'label' => 'Vendor Portal'],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'LIC-'], ['type' => 'sequence', 'minDigits' => 3]]],
            ],
            // 7. Chemical Storage (Hazardous, Strict Validation)
            [
                'title' => 'Chemical Storage B3',
                'description' => "Hazardous materials tracking. \n> ⚠️ Requires safety certification to access.",
                'isPublic' => false,
                'category' => 'Raw Materials',
                'tags' => ['limited', 'certified'], // "hazardous" not created, using limited
                'creator' => 4, // Jane
                'fields' => [
                    ['type' => 'string', 'label' => 'Chemical Name', 'required' => true],
                    ['type' => 'string', 'label' => 'CAS Number', 'regex' => '^\\d{2,7}-\\d{2}-\\d$', 'description' => 'CAS Registry Number (e.g. 64-17-5)'],
                    ['type' => 'number', 'label' => 'Quantity (L)', 'min' => 0, 'max' => 1000],
                    ['type' => 'select', 'label' => 'Hazard Class', 'options' => ['Flammable', 'Corrosive', 'Toxic', 'Reactive', 'None']],
                    ['type' => 'boolean', 'label' => 'MSDS on File', 'required' => true],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'CHEM-'], ['type' => 'sequence', 'minDigits' => 4]]],
            ],
            // 8. Art Gallery (High Value, Descriptive)
            [
                'title' => 'Modern Art Collection',
                'description' => "Curated collection of modern artworks.",
                'isPublic' => true,
                'category' => 'Collectibles',
                'tags' => ['vintage', 'premium', 'handmade'],
                'creator' => 7, // Harvey
                'fields' => [
                    ['type' => 'string', 'label' => 'Title', 'required' => true],
                    ['type' => 'string', 'label' => 'Artist'],
                    ['type' => 'text', 'label' => 'Description'],
                    ['type' => 'number', 'label' => 'Insured Value', 'min' => 1000],
                    ['type' => 'string', 'label' => 'Accession Number', 'regex' => '^ACC-\\d{4}-\\d{3}$'],
                ],
                'idConfig' => ['elements' => [['type' => 'fixed', 'value' => 'ART-'], ['type' => 'date', 'format' => 'YYYY'], ['type' => 'fixed', 'value' => '-'], ['type' => 'sequence', 'minDigits' => 3]]],
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
            } else {
                $inventory->setCategory($categoryMap['Other'] ?? $categoryMap[array_key_first($categoryMap)]);
            }

            if (!empty($data['tags'])) {
                foreach ($data['tags'] as $tagName) {
                    if (isset($tagMap[$tagName])) {
                        $inventory->addTag($tagMap[$tagName]);
                    }
                }
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

            // Create fields for this inventory
            $fieldEntities = [];
            if (!empty($data['fields'])) {
                foreach ($data['fields'] as $pos => $fieldData) {
                    $field = $this->createField($inventory, $fieldData['type'], $fieldData['label'], $pos, $fieldData);
                    $manager->persist($field);
                    $fieldEntities[] = $field;
                }
            }
            
            $inventories[] = ['entity' => $inventory, 'fields' => $fieldEntities];
        }

        return $inventories;
    }

    private function createItems(ObjectManager $manager, array $inventories, array $users, array $tags): array
    {
        $tagMap = [];
        foreach ($tags as $tag) {
            $tagMap[$tag->getName()] = $tag;
        }

        // Items data per inventory index
        $itemsData = [
            // 0: Tech Gadgets
            0 => [
                ['Apple', 'iPhone 15 Pro', 999, 50, true, 'https://www.apple.com/iphone', ['new', 'popular']],
                ['Samsung', 'Galaxy S24 Ultra', 1199, 32, true, 'https://www.samsung.com', ['new', 'popular']],
                ['Google', 'Pixel 8 Pro', 899, 15, true, 'https://store.google.com', ['new']],
                ['Apple', 'MacBook Air M3', 1099, 20, true, null, ['premium']],
                ['Dell', 'XPS 15', 1499, 5, false, null, []],
                ['Lenovo', 'ThinkPad X1 Carbon', 1299, 10, true, null, ['premium']],
                ['Apple', 'iPad Air', 599, 45, true, null, ['popular']],
                ['Samsung', 'Galaxy Tab S9', 799, 25, true, null, []],
                ['Sony', 'WH-1000XM5', 349, 100, true, null, ['popular']],
                ['Apple', 'AirPods Pro 2', 249, 150, true, null, ['popular']],
            ],
            // 1: Furniture
            1 => [
                ['Herman Miller Aeron Chair', 'Executive Office', 'Excellent', 1200],
                ['Steelcase Leap Chair', 'Room 202', 'Good', 900],
                ['Basic Task Chair', 'Cubicle Area', 'Fair', 150],
                ['Standing Desk Pro', 'Room 205', 'New', 800],
                ['Oak Conference Table', 'Boardroom', 'Excellent', 2500],
                ['Filing Cabinet 4-Drawer', 'Room 101', 'Good', 200],
                ['Bookshelf Unit', 'Library', 'Good', 350],
                ['Reception Desk', 'Lobby', 'Excellent', 1800],
            ],
            // 2: Vehicles
            2 => [
                ['Ford F-150', 'XYZ-1234', 'Mike Ross', 45000, false],
                ['Toyota Camry', 'ABC-5678', 'Sales Team', 25000, true],
                ['Honda Civic', 'DEF-9012', 'Pool Vehicle', 15000, false],
                ['Tesla Model 3', 'EV-0001', 'Alex Chen', 10000, false],
                ['Chevy Suburban', 'SUV-2024', 'Executive', 35000, true],
            ],
            // 3: Ancient Manuscripts
            3 => [
                ['The Voynich Manuscript', 'Unknown', 'Italy', 1420, 50000000],
                ['Codex Leicester', 'Leonardo da Vinci', 'Italy', 1510, 30000000],
                ['Book of Kells', 'Celtic Monks', 'Ireland', 800, 15000000],
                ['Dead Sea Scrolls Fragment', 'Various', 'Israel', -200, 25000000],
            ],
            // 4: Lab Equipment
            4 => [
                ['Digital Microscope', 'MIC-2024-001', true, '2024-01-15'],
                ['Centrifuge XR-500', 'CEN-2023-042', true, '2024-02-20'],
                ['Spectrophotometer', 'SPE-2022-103', false, '2023-06-10'],
                ['pH Meter Pro', 'PHM-2024-007', true, '2024-03-01'],
                ['Analytical Balance', 'BAL-2021-055', true, '2024-01-30'],
            ],
            // 5: Conference Attendees
            5 => [
                ['John Smith', 'john.smith@techcorp.com', 'TechCorp', 34, 'None', true],
                ['Sarah Johnson', 'sarah.j@startup.io', 'StartupIO', 28, 'Vegetarian', false],
                ['Michael Chen', 'mchen@bigdata.com', 'BigData Inc', 42, 'None', true],
                ['Emily Brown', 'emily@designco.com', 'DesignCo', 31, 'Vegan', false],
                ['David Wilson', 'dwilson@enterprise.org', 'Enterprise Org', 45, 'Gluten-Free', true],
                ['Lisa Anderson', 'lisa.a@innovate.tech', 'Innovate Tech', 29, 'Halal', false],
                ['Robert Taylor', 'rtaylor@consulting.biz', 'ConsultingBiz', 38, 'None', false],
                ['Jennifer Martinez', 'jmartinez@global.net', 'GlobalNet', 33, 'Vegetarian', true],
            ],
            // 6: Software Licenses [Name, Key, Type, Seats, Link]
            6 => [
                 ['Adobe Creative Cloud', 'ABCD-EFGH-IJKL-MNOP', 'Subscription', '50', 'https://admin.adobe.com'],
                 ['JetBrains All Products', 'JETB-RAINS-2024-XKEY', 'Subscription', '25', 'https://account.jetbrains.com'],
                 ['Windows 11 Pro Volume', 'WIND-OWS1-1PRO-KEYX', 'Perpetual', '100', null],
                 ['Visual Studio Ent', 'VISU-ALST-UDIO-KEYZ', 'Perpetual', '10', 'https://my.visualstudio.com'],
            ],
            // 7: Chemicals [Name, CAS, Qty, Hazard, MSDS]
            7 => [
                ['Ethanol', '64-17-5', 500, 'Flammable', true],
                ['Sulfuric Acid', '7664-93-9', 50, 'Corrosive', true],
                ['Sodium Hydroxide', '1310-73-2', 100, 'Corrosive', true],
                ['Acetone', '67-64-1', 200, 'Flammable', true],
                ['Sodium Chloride', '7647-14-5', 1000, 'None', true],
            ],
             // 8: Art [Title, Artist, Desc, Value, Accession]
            8 => [
                ['Starry Night (Print)', 'Vincent van Gogh', 'High quality lithograph.', 1500, 'ACC-2024-001'],
                ['Composition VIII', 'Kandinsky', 'Abstract geometric composition.', 5000, 'ACC-2023-042'],
                ['The Kiss (Repro)', 'Gustav Klimt', 'Gold leaf reproduction.', 2200, 'ACC-2024-005'],
                ['Persistence of Memory', 'Salvador Dali', 'Surrealist classic print.', 1800, 'ACC-2022-099'],
            ],
        ];

        $allItems = [];

        foreach ($inventories as $invIndex => $invData) {
            $inventory = $invData['entity'];
            $fields = $invData['fields'];
            
            if (!isset($itemsData[$invIndex])) continue;

            $seq = 1;
            foreach ($itemsData[$invIndex] as $rawItem) {
                $item = new Item();
                $item->setInventory($inventory);
                $item->setSequenceNumber($seq);
                $item->setCreatedBy($users[array_rand($users)]);

                // Generate custom ID
                $config = $inventory->getIdGenerationConfig();
                $prefix = 'ITEM-';
                if (!empty($config['elements'])) {
                    foreach ($config['elements'] as $el) {
                        if ($el['type'] === 'fixed') {
                            $prefix = $el['value'];
                            break;
                        }
                    }
                }
                $item->setCustomId($prefix . str_pad($seq, 4, '0', STR_PAD_LEFT));

                // Set field values based on inventory type
                foreach ($fields as $fieldIndex => $field) {
                    if (isset($rawItem[$fieldIndex])) {
                        $item->setFieldValue($field, $rawItem[$fieldIndex]);
                    }
                }

                // Handle tags (last element if array)
                $lastEl = end($rawItem);
                if (is_array($lastEl)) {
                    foreach ($lastEl as $tagName) {
                        if (isset($tagMap[$tagName])) {
                            $item->addTag($tagMap[$tagName]);
                        }
                    }
                }

                $manager->persist($item);
                $allItems[] = $item;
                $seq++;
            }
        }

        return $allItems;
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
            "Verification complete.",
        ];

        foreach ($inventories as $invData) {
            $inv = $invData['entity'];
            if (rand(0, 1) === 1) {
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

    private function createLikes(array $items, array $users): void
    {
        foreach ($items as $item) {
            if (rand(0, 2) === 0) {
                $count = rand(1, 5);
                $keys = array_rand($users, min($count, count($users)));
                if (!is_array($keys)) $keys = [$keys];
                
                foreach ($keys as $k) {
                    $item->addLikedBy($users[$k]);
                }
            }
        }
    }

    private function createActivities(ObjectManager $manager, array $inventories, array $users): void
    {
        foreach ($inventories as $invData) {
            $inv = $invData['entity'];
            
            // Some views
            for ($k = 0; $k < rand(5, 20); $k++) {
                $act = new Activity();
                $act->setInventory($inv);
                $act->setUser($users[array_rand($users)]);
                $act->setType('view');
                $act->setCreatedAt(new \DateTime('-' . rand(1, 14) . ' days'));
                $manager->persist($act);
            }

            // Some Item Adds
            for ($k = 0; $k < rand(1, 3); $k++) {
                $act = new Activity();
                $act->setInventory($inv);
                $act->setUser($inv->getCreator());
                $act->setType('item_add');
                $act->setCreatedAt(new \DateTime('-' . rand(15, 30) . ' days'));
                $act->setMetadata(['itemId' => 'fixture', 'customId' => 'SAMPLE-ITEM']);
                $manager->persist($act);
            }
        }
    }
}
