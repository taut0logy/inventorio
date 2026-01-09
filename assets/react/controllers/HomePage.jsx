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

    const features = [
        {
            icon: Fingerprint,
            titleKey: 'home.feature.custom_id.title',
            titleFallback: 'Custom ID Generation',
            descKey: 'home.feature.custom_id.desc',
            descFallback: 'Create unique item identifiers with composable elements: sequences, dates, random codes, and fixed text.',
        },
        {
            icon: Settings2,
            titleKey: 'home.feature.custom_fields.title',
            titleFallback: 'Flexible Custom Fields',
            descKey: 'home.feature.custom_fields.desc',
            descFallback: 'Define up to 15 custom fields per inventory: text, numbers, links, and boolean values.',
        },
        {
            icon: Users,
            titleKey: 'home.feature.access.title',
            titleFallback: 'Access Control',
            descKey: 'home.feature.access.desc',
            descFallback: 'Share private inventories with specific users. Control who can view and edit your data.',
        },
        {
            icon: MessageSquare,
            titleKey: 'home.feature.discussion.title',
            titleFallback: 'Real-time Discussion',
            descKey: 'home.feature.discussion.desc',
            descFallback: 'Collaborate with your team through per-inventory discussion threads with instant updates.',
        },
        {
            icon: Search,
            titleKey: 'home.feature.search.title',
            titleFallback: 'Full-text Search',
            descKey: 'home.feature.search.desc',
            descFallback: 'Find any inventory or item instantly with powerful full-text search across all fields.',
        },
        {
            icon: Shield,
            titleKey: 'home.feature.security.title',
            titleFallback: 'Concurrent Editing',
            descKey: 'home.feature.security.desc',
            descFallback: 'Optimistic locking prevents data conflicts when multiple users edit simultaneously.',
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-50" />
                
                <div className="container mx-auto px-4 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">{t('home.hero.badge', 'Schema-Driven Inventory Management')}</span>
                        </div>
                        
                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
                            {t('home.hero.title', 'Manage Your Inventory')}{' '}
                            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                                {t('home.hero.highlight', 'Effortlessly')}
                            </span>
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {t('home.hero.subtitle', 'Create custom inventories with flexible fields, unique ID formats, and powerful organization tools. Built for teams who need control over their data.')}
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
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
                        <div className="flex flex-wrap justify-center items-center gap-6 mt-12 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
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
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            {t('home.features.title', 'Everything you need to manage inventory')}
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('home.features.subtitle', 'Powerful features designed for flexibility and control.')}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <Card key={index} className="bg-background/50 backdrop-blur-sm border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{t(feature.titleKey, feature.titleFallback)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-relaxed">
                                        {t(feature.descKey, feature.descFallback)}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                {/* Latest Inventories Section */}
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
                    
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            {latestInventories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
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
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
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

                {/* Popular Inventories Section */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight">{t('home.popular.title', 'Top 5 Popular')}</h2>
                        </div>
                    </div>
                    
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            {popularInventories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-16 font-semibold text-center">#</TableHead>
                                            <TableHead className="font-semibold">{t('table.title', 'Title')}</TableHead>
                                            <TableHead className="hidden sm:table-cell font-semibold text-right">{t('table.views', 'Views')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {popularInventories.map((inventory, index) => (
                                            <TableRow 
                                                key={index} 
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => window.location.href = `/inventory/${inventory.id}`}
                                            >
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold ${
                                                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-600' :
                                                        index === 2 ? 'bg-orange-500/20 text-orange-600' :
                                                        'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">{inventory.title}</TableCell>
                                                <TableCell className="hidden sm:table-cell text-right text-muted-foreground font-mono">
                                                    {inventory.viewCount?.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-16">
                                    <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">{t('home.no_popular', 'No popular inventories yet.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Tags Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">{t('home.browse_tags', 'Browse by Tags')}</h2>
                    </div>
                    
                    {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <a key={index} href={`/search?q=${encodeURIComponent(tag.name)}`}>
                                    <Badge 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm py-1.5 px-4"
                                    >
                                        #{tag.name}
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
                                <Card className="h-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group-hover:shadow-md">
                                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                        <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                            {category.icon || '📦'}
                                        </span>
                                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{category.name}</span>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>
                </section>
            </div>

            {/* CTA Section */}
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
