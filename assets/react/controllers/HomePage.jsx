import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Package, 
    ArrowRight, 
    TrendingUp, 
    Clock,
    FolderOpen,
    Fingerprint,
    Settings2,
    Users,
    MessageSquare,
    Search,
    Shield,
    Zap,
    Lock,
    Globe,
    Heart
} from 'lucide-react';
import { motion } from "motion/react";
import { t } from '@/lib/i18n';

import { Spotlight } from '@/components/ui/spotlight-new';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { TagCloudSphere } from '@/components/ui/tag-cloud';

import logo from '@/../images/logo.svg';
import box from '@/../images/box-icon.svg';

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

    // Features for card hover effect
    const features = [
        {
            title: t('home.feature.custom_id.title', 'Custom ID Generation'),
            description: t('home.feature.custom_id.desc', 'Create unique item identifiers with composable elements: sequences, dates, random codes, and fixed text.'),
            link: '#',
        },
        {
            title: t('home.feature.custom_fields.title', 'Flexible Custom Fields'),
            description: t('home.feature.custom_fields.desc', 'Define up to 15 custom fields per inventory: text, numbers, links, and boolean values.'),
            link: '#',
        },
        {
            title: t('home.feature.access.title', 'Access Control'),
            description: t('home.feature.access.desc', 'Share private inventories with specific users. Control who can view and edit your data.'),
            link: '#',
        },
        {
            title: t('home.feature.discussion.title', 'Real-time Discussion'),
            description: t('home.feature.discussion.desc', 'Collaborate with your team through per-inventory discussion threads with instant updates.'),
            link: '#',
        },
        {
            title: t('home.feature.search.title', 'Full-text Search'),
            description: t('home.feature.search.desc', 'Find any inventory or item instantly with powerful full-text search across all fields.'),
            link: '#',
        },
        {
            title: t('home.feature.security.title', 'Concurrent Editing'),
            description: t('home.feature.security.desc', 'Optimistic locking prevents data conflicts when multiple users edit simultaneously.'),
            link: '#',
        },
    ];

    const popularItems = popularInventories.map((inv) => ({
        quote: inv.description || `${inv.itemCount || 0} items tracked`,
        name: inv.title,
        title: `❤️ ${inv.likeCount || 0} • 👁️ ${inv.viewCount?.toLocaleString() || 0} • ${inv.category || 'General'}`,
        href: `/inventory/${inv.id}`,
    }));

    const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 768;

    return (
        <div>
            <section 
                className="relative overflow-hidden flex items-center justify-center bg-background"
                style={{ minHeight: 'calc(100dvh - 56px)' }}
            >
                {/* Spotlight Effect */}
                <Spotlight />
                
                <div className="relative z-10">
                    <div className="text-center max-w-4xl mx-auto px-6">
                        <motion.div 
                            className="mb-6 inline-block relative"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="absolute inset-0 bg-transparent blur-xl rounded-full opacity-50"></div>
                            <div className="relative p-2 rounded-3xl bg-transparent">
                                <motion.div
                                    animate={{ 
                                        y: [-5, 5, -5],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 6, 
                                        repeat: Infinity, 
                                        ease: "easeInOut" 
                                    }}
                                >
                                    <img src={logo} alt="Inventorio Logo" className="h-20 w-20 object-contain" />
                                </motion.div>
                            </div>
                        </motion.div>
                        
                        {/* Title with Typewriter Highlight */}
                        <div className="mb-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                                {t('home.hero.title', 'Manage Your Inventory')}
                            </h1>
                            <TypewriterEffectSmooth 
                                words={[
                                    { text: t('home.hero.highlight', 'Effortlessly'), className: 'text-primary' }
                                ]}
                                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl justify-center"
                                cursorClassName="bg-primary"
                            />
                        </div>
                        
                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            {t('home.hero.subtitle', 'Create custom inventories with flexible fields, unique ID formats, and powerful organization tools. Built for teams who need control over their data.')}
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {isLoggedIn ? (
                                <>
                                    <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                                        <a href={createInventoryPath || myInventoriesPath || '#'}>
                                            {t('home.hero.create', 'Create Inventory')}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </a>
                                    </Button>
                                    <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                                        <a href={myInventoriesPath || '#'}>
                                            <Package className="mr-2 h-5 w-5" />
                                            {t('home.hero.my_inventories', 'My Inventories')}
                                        </a>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                                        <a href={registerPath}>
                                            {t('nav.register', 'Get Started Free')}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </a>
                                    </Button>
                                    <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                                        <a href={loginPath}>
                                            <Lock className="mr-2 h-5 w-5" />
                                            {t('nav.login', 'Sign In')}
                                        </a>
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        {/* Trust indicators */}
                        {/* <div className="flex flex-wrap justify-center items-center gap-6 mt-12 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>{t('home.hero.feature1', 'Multi-language support')}</span>
                            </div>
                            <div className="h-4 w-px bg-border hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <span>{t('home.hero.feature2', 'Secure by design')}</span>
                            </div>
                            <div className="h-4 w-px bg-border hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{t('home.hero.feature3', 'Team collaboration')}</span>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES with Card Hover Effect ===== */}
            <section className="py-16 md:py-24 bg-muted/30 container mx-auto px-4 md:px-6 lg:px-8">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            {t('home.features.title', 'Everything you need to manage inventory')}
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('home.features.subtitle', 'Powerful features designed for flexibility and control.')}
                        </p>
                    </div>
                    
                    <HoverEffect items={features} className="max-w-5xl mx-auto" />
                </div>
            </section>

            {/* ===== POPULAR INVENTORIES with Infinite Moving Cards ===== */}
            {popularInventories.length > 0 && (
                <section className="py-16 md:py-24 container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="container mx-auto px-4 mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight">{t('home.popular.title', 'Top 5 Popular')}</h2>
                        </div>
                        <p className="text-muted-foreground ml-13">{t('home.popular.subtitle', 'Most viewed inventories this week')}</p>
                    </div>
                    
                    <InfiniteMovingCards
                        items={popularItems}
                        direction="left"
                        speed="slow"
                        pauseOnHover={true}
                        className="py-4"
                    />
                </section>
            )}

            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
                {/* ===== LATEST INVENTORIES (Table - Required) ===== */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight">{t('home.latest.title', 'Latest Inventories')}</h2>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <a href="/search">
                                {t('home.view_all', 'View All')}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                    
                    <Card className="overflow-hidden border-muted/50 shadow-lg">
                        <CardContent className="p-0">
                            {latestInventories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="font-semibold">{t('table.title', 'Title')}</TableHead>
                                            <TableHead className="hidden md:table-cell font-semibold">{t('table.category', 'Category')}</TableHead>
                                            <TableHead className="hidden sm:table-cell font-semibold text-center">{t('table.items', 'Items')}</TableHead>
                                            <TableHead className="hidden lg:table-cell font-semibold">{t('table.created', 'Created')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {latestInventories.map((inventory, index) => (
                                            <TableRow 
                                                key={index} 
                                                className="cursor-pointer hover:bg-primary/5 transition-all duration-200"
                                                onClick={() => window.location.href = `/inventory/${inventory.id}`}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        {inventory.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant="secondary">{inventory.category}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-center">
                                                    <span className="font-mono">{inventory.itemCount}</span>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                    {inventory.createdAt}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-16">
                                    <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground mb-4">{t('home.no_inventories', 'No inventories yet. Be the first to create one!')}</p>
                                    {isLoggedIn && (
                                        <Button asChild>
                                            <a href={createInventoryPath || myInventoriesPath}>
                                                {t('home.hero.create', 'Create Inventory')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* ===== TAGS Section ===== */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">{t('home.browse_tags', 'Browse by Tags')}</h2>
                    </div>
                    
                    {tags.length > 0 ? (
                        <div className="flex justify-center py-8">
                           <TagCloudSphere tags={tags} size={isLargeScreen ? 500 : 320} />
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t('home.no_tags', 'No tags available.')}</p>
                    )}
                </section>

                {/* ===== CATEGORIES Section ===== */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">{t('home.categories.title', 'Categories')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.map((category, index) => (
                            <a 
                                key={index} 
                                href={`/search?category=${encodeURIComponent(category.name)}`}
                                className="group"
                            >
                                <Card className="h-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:-translate-y-1">
                                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                        <div 
                                            className="w-16 h-16 mb-3 group-hover:scale-110 transition-transform duration-300 bg-primary"
                                            style={{
                                                maskImage: `url(${category.icon || box})`,
                                                maskSize: 'contain',
                                                maskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                                WebkitMaskImage: `url(${category.icon || box})`,
                                                WebkitMaskSize: 'contain',
                                                WebkitMaskRepeat: 'no-repeat',
                                                WebkitMaskPosition: 'center',
                                            }}
                                        />
                                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{category.name}</span>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>
                </section>
            </div>

            {/* ===== CTA Section ===== */}
            {!isLoggedIn && (
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            {t('home.cta.title', 'Ready to get started?')}
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                            {t('home.cta.subtitle', 'Create your first inventory in minutes. No credit card required.')}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                                <a href={registerPath}>
                                    {t('home.cta.button', 'Create Free Account')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
