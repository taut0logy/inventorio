<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Tag;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
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
            'new',
            'used',
            'refurbished',
            'limited',
            'discontinued',
            'popular',
            'sale',
            'premium',
            'eco-friendly',
            'vintage',
            'imported',
            'local',
            'handmade',
            'certified',
            'warranty',
        ];

        foreach ($tags as $tagName) {
            $tag = new Tag();
            $tag->setName($tagName);
            $tag->setPredefined(true);
            $manager->persist($tag);
        }

        // Create Users
        $admin = new \App\Entity\User();
        $admin->setEmail('admin@example.com');
        $admin->setName('Admin User');
        $admin->setPassword('$2y$13$XyQk.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0'); // bcrypt hash for 'password'
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setEmailVerified(true);
        $manager->persist($admin);

        $user = new \App\Entity\User();
        $user->setEmail('user@example.com');
        $user->setName('John Doe');
        $user->setPassword('$2y$13$XyQk.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0'); // bcrypt hash for 'password'
        $user->setEmailVerified(true);
        $manager->persist($user);

        $manager->flush(); // Flush users to get IDs

        // Create Inventories
        $inventoryTitles = [
            'Main Warehouse', 'Office Storage', 'Garage Tools', 'Home Library',
            'Kitchen Pantry', 'Vehicle Fleet', 'Project Alpha', 'Backup Supplies'
        ];

        foreach ($inventoryTitles as $i => $title) {
            $inventory = new \App\Entity\Inventory();
            $inventory->setTitle($title);
            $inventory->setDescription("Description for $title. This simulates a Markdown *description*.");
            $inventory->setPublic($i % 2 === 0);
            $inventory->setCategory($manager->getRepository(Category::class)->findOneBy(['name' => 'Other'])); // Fallback
            
            // Assign random category
            // We can't easily get random category without querying all, so let's just pick one we created
            // Effectively we just use one for now or loop
            
            $inventory->setCreator($i % 3 === 0 ? $admin : $user);
            
            $manager->persist($inventory);
        }

        $manager->flush();
    }
}
