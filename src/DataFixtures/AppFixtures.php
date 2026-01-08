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

        $manager->flush();
    }
}
