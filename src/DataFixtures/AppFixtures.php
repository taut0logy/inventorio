<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Inventory;
use App\Entity\InventoryField;
use App\Entity\Tag;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // Create default categories with SVG icon URLs (from Iconify CDN)
        $categories = [
            ['name' => 'Electronics', 'icon' => 'https://api.iconify.design/lucide/laptop.svg'],
            ['name' => 'Furniture', 'icon' => 'https://api.iconify.design/lucide/armchair.svg'],
            ['name' => 'Office Supplies', 'icon' => 'https://api.iconify.design/lucide/paperclip.svg'],
            ['name' => 'Tools & Equipment', 'icon' => 'https://api.iconify.design/lucide/wrench.svg'],
            ['name' => 'Vehicles', 'icon' => 'https://api.iconify.design/lucide/car.svg'],
            ['name' => 'Books & Media', 'icon' => 'https://api.iconify.design/lucide/book-open.svg'],
            ['name' => 'Clothing & Accessories', 'icon' => 'https://api.iconify.design/lucide/shirt.svg'],
            ['name' => 'Food & Beverages', 'icon' => 'https://api.iconify.design/lucide/apple.svg'],
            ['name' => 'Medical Supplies', 'icon' => 'https://api.iconify.design/lucide/pill.svg'],
            ['name' => 'Raw Materials', 'icon' => 'https://api.iconify.design/lucide/boxes.svg'],
            ['name' => 'Collectibles', 'icon' => 'https://api.iconify.design/lucide/trophy.svg'],
            ['name' => 'Other', 'icon' => 'https://api.iconify.design/lucide/package.svg'],
        ];

        foreach ($categories as $categoryData) {
            $category = new Category();
            $category->setName($categoryData['name']);
            $category->setIconUrl($categoryData['icon']);
            $manager->persist($category);
        }
        $manager->flush();

        // Create predefined tags
        $tags = [
            'new', 'used', 'refurbished', 'limited', 'discontinued',
            'popular', 'sale', 'premium', 'eco-friendly', 'vintage',
            'imported', 'local', 'handmade', 'certified', 'warranty',
        ];

        foreach ($tags as $tagName) {
            $tag = new Tag();
            $tag->setName($tagName);
            $tag->setPredefined(true);
            $manager->persist($tag);
        }

        // Create Users
        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setName('Admin User');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password'));
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setEmailVerified(true);
        $manager->persist($admin);

        $user = new User();
        $user->setEmail('user@example.com');
        $user->setName('John Doe');
        $user->setPassword($this->passwordHasher->hashPassword($user, 'password'));
        $user->setEmailVerified(true);
        $manager->persist($user);

        $manager->flush();

        // Create Inventories with default fields
        $inventoryTitles = [
            'Main Warehouse', 'Office Storage', 'Garage Tools', 'Home Library',
            'Kitchen Pantry', 'Vehicle Fleet', 'Project Alpha', 'Backup Supplies'
        ];

        $otherCategory = $manager->getRepository(Category::class)->findOneBy(['name' => 'Other']);

        foreach ($inventoryTitles as $i => $title) {
            $inventory = new Inventory();
            $inventory->setTitle($title);
            $inventory->setDescription("Description for $title. This simulates a Markdown *description*.");
            $inventory->setPublic($i % 2 === 0);
            $inventory->setCategory($otherCategory);
            $inventory->setCreator($i % 3 === 0 ? $admin : $user);
            
            // Create default fields for this inventory
            $inventory->createDefaultFields();
            
            $manager->persist($inventory);
        }

        $manager->flush();
    }
}
