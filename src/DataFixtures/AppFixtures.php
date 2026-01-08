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
        // Create default categories
        $categories = [
            ['name' => 'Electronics', 'icon' => null],
            ['name' => 'Furniture', 'icon' => null],
            ['name' => 'Office Supplies', 'icon' => null],
            ['name' => 'Tools & Equipment', 'icon' => null],
            ['name' => 'Vehicles', 'icon' => null],
            ['name' => 'Books & Media', 'icon' => null],
            ['name' => 'Clothing & Accessories', 'icon' => null],
            ['name' => 'Food & Beverages', 'icon' => null],
            ['name' => 'Medical Supplies', 'icon' => null],
            ['name' => 'Raw Materials', 'icon' => null],
            ['name' => 'Collectibles', 'icon' => null],
            ['name' => 'Other', 'icon' => null],
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
