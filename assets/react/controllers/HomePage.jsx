import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ArrowRight, TrendingUp, Clock, FolderOpen } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function HomePage({ 
    user, 
    categories = [], 
    tags = [], 
    latestInventories = [], 
    popularInventories = [],
    homePath,
    loginPath,
    registerPath,
    createInventoryPath,
    myInventoriesPath,
}) {
    const isLoggedIn = !!user;

    return (
        <div>
            {/* Hero Section */}
            <section className="relative py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 relative min-h-screen">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm mb-6">
                            <Package className="h-4 w-4 text-primary" />
                            <span>Smart Inventory Management</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            {t('home.hero.title', 'Manage Your Inventory')}{' '}
                            <span className="text-primary">Effortlessly</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            {t('home.hero.subtitle', 'Create custom inventories with flexible fields.')}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {isLoggedIn ? (
                                <>
                                    <Button size="lg" asChild>
                                        <a href={createInventoryPath || '#'}>
                                            {t('home.hero.create', 'Create Inventory')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <a href={myInventoriesPath || '#'}>
                                            {t('home.hero.my_inventories', 'My Inventories')}
                                        </a>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="lg" asChild>
                                        <a href={registerPath}>
                                            {t('nav.register', 'Get Started')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <a href={loginPath}>
                                            {t('nav.login', 'Sign In')}
                                        </a>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 pb-16">
                {/* Latest Inventories Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold tracking-tight">{t('home.latest.title', 'Latest Inventories')}</h2>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <a href="#">
                                {t('home.view_all', 'View All')}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                    
                    <Card>
                        <CardContent className="p-0">
                            {latestInventories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('table.title', 'Title')}</TableHead>
                                            <TableHead className="hidden md:table-cell">{t('table.category', 'Category')}</TableHead>
                                            <TableHead className="hidden sm:table-cell">{t('table.items', 'Items')}</TableHead>
                                            <TableHead className="hidden lg:table-cell">{t('table.created', 'Created')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {latestInventories.map((inventory, index) => (
                                            <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">{inventory.title}</TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant="secondary">{inventory.category}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">{inventory.itemCount}</TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                    {inventory.createdAt}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">{t('home.no_inventories', 'No inventories yet.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Popular Inventories Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold tracking-tight">{t('home.popular.title', 'Top 5 Popular')}</h2>
                        </div>
                    </div>
                    
                    <Card>
                        <CardContent className="p-0">
                            {popularInventories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>{t('table.title', 'Title')}</TableHead>
                                            <TableHead className="hidden sm:table-cell text-right">{t('table.views', 'Views')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {popularInventories.map((inventory, index) => (
                                            <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                                                <TableCell className="font-medium">{inventory.title}</TableCell>
                                                <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                                                    {inventory.viewCount?.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">{t('home.no_popular', 'No popular inventories.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Tags Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold tracking-tight mb-6">{t('home.browse_tags', 'Browse by Tags')}</h2>
                    
                    {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <a key={index} href={`#tag-${tag.name}`}>
                                    <Badge 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-secondary/80 transition-colors text-sm py-1 px-3"
                                    >
                                        {tag.name}
                                    </Badge>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t('home.no_tags', 'No tags available.')}</p>
                    )}
                </section>

                {/* Categories Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-2xl font-semibold tracking-tight">{t('home.categories.title', 'Categories')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.map((category, index) => (
                            <a 
                                key={index} 
                                href={`#category-${category.id}`}
                                className="group"
                            >
                                <Card className="h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                        <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                                            {category.icon || '📁'}
                                        </span>
                                        <span className="text-sm font-medium">{category.name}</span>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
