import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Package, Box, ArrowRight, ChevronDown, User } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function SearchPage({ initialQuery = '' }) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState({ inventories: [], items: [], users: [], total: 0, hasMoreInventories: false, hasMoreItems: false });
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searched, setSearched] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [perPage, setPerPage] = useState(10);
    const [inventoryOffset, setInventoryOffset] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);

    const performSearch = async (q, category = null, append = false, type = 'all') => {
        if ((!q || q.length < 2) && !category) return;
        
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setInventoryOffset(0);
            setItemOffset(0);
        }

        try {
            const offset = type === 'items' ? itemOffset : inventoryOffset;
            let url = `/api/search?limit=${perPage}&offset=${append ? offset : 0}`;
            if (q) url += `&q=${encodeURIComponent(q)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (append && type !== 'all') url += `&type=${type}`;

            const res = await fetch(url);
            const data = await res.json();
            
            if (append) {
                if (type === 'inventories') {
                    setResults(prev => ({
                        ...prev,
                        inventories: [...prev.inventories, ...data.inventories],
                        hasMoreInventories: data.hasMoreInventories,
                    }));
                    setInventoryOffset(prev => prev + data.inventories.length);
                } else if (type === 'items') {
                    setResults(prev => ({
                        ...prev,
                        items: [...prev.items, ...data.items],
                        hasMoreItems: data.hasMoreItems,
                    }));
                    setItemOffset(prev => prev + data.items.length);
                }
            } else {
                setResults(data);
                setInventoryOffset(data.inventories.length);
                setItemOffset(data.items.length);
                setSearched(true);
                
                const browserUrl = new URL(window.location);
                if (q) browserUrl.searchParams.set('q', q);
                else browserUrl.searchParams.delete('q');
                
                if (category) browserUrl.searchParams.set('category', category);
                else browserUrl.searchParams.delete('category');

                window.history.pushState({}, '', browserUrl);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        if (category) setActiveCategory(category);

        if (initialQuery || category) {
            performSearch(initialQuery, category);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        performSearch(query, activeCategory);
    };

    const clearCategory = () => {
        setActiveCategory(null);
        if (query.length >= 2) {
            performSearch(query, null);
        } else {
            setResults({ inventories: [], items: [], total: 0, hasMoreInventories: false, hasMoreItems: false });
            setSearched(false);
        }
    };

    const loadMoreInventories = () => {
        performSearch(query, activeCategory, true, 'inventories');
    };

    const loadMoreItems = () => {
        performSearch(query, activeCategory, true, 'items');
    };

    const handlePerPageChange = (value) => {
        const newPerPage = parseInt(value, 10);
        setPerPage(newPerPage);
        // Re-search with new limit
        if (searched) {
            setTimeout(() => performSearch(query, activeCategory), 0);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">{t('search.title', 'Search')}</h1>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-8">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search.placeholder', 'Search inventories, items, tags...')}
                        className="pl-10 h-12 text-lg"
                        autoFocus
                    />
                </div>
                {activeCategory && (
                     <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md h-12">
                        <span className="text-sm font-medium whitespace-nowrap">{t('search.category', 'Category')}: {activeCategory}</span>
                        <button type="button" onClick={clearCategory} className="text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Remove filter</span>
                             ✕
                        </button>
                    </div>
                )}
                <Button type="submit" size="lg" disabled={loading || (query.length < 2 && !activeCategory)}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('search.submit', 'Search')}
                </Button>
            </form>

            {/* Results per page dropdown */}
            {searched && (
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-muted-foreground">
                        {results.total === 0 
                            ? t('search.no_results', 'No results found')
                            : (query 
                                ? t('search.results_for', { count: results.total, query }, `Found ${results.total} results for "${query}"`)
                                : t('search.results_count', { count: results.total }, `Found ${results.total} results`)
                              )
                        }
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('search.per_page', 'Per page')}:</span>
                        <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : searched ? (
                <div className="space-y-12">
                    {/* Inventories */}
                    {results.inventories.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <Package className="h-6 w-6 text-primary" />
                                <h3 className="text-2xl font-bold">{t('search.inventories', 'Inventories')}</h3>
                                <Badge variant="secondary">{results.inventories.length}</Badge>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {results.inventories.map(inv => (
                                    <a key={inv.id} href={`/inventory/${inv.id}`} className="group">
                                        <Card className="h-full hover:border-primary transition-colors">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    {inv.imageUrl ? (
                                                        <img src={inv.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <Badge variant="outline">{inv.category?.name}</Badge>
                                                </div>
                                                <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                                    {inv.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                                                    {inv.description || t('inventory.no_desc', 'No description')}
                                                </p>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <span>{inv.itemCount} {t('inventory.items_count', 'items')}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{inv.creator?.name}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                            {results.hasMoreInventories && (
                                <div className="flex justify-center mt-6">
                                    <Button 
                                        variant="outline" 
                                        onClick={loadMoreInventories}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                        {t('search.load_more', 'Load More')}
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Items */}
                    {results.items.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <Box className="h-6 w-6 text-primary" />
                                <h3 className="text-2xl font-bold">{t('search.items', 'Items')}</h3>
                                <Badge variant="secondary">{results.items.length}</Badge>
                            </div>
                            <div className="space-y-4">
                                {results.items.map(item => (
                                    <a key={item.id} href={`/inventory/${item.inventoryId}`} className="block group">
                                        <Card className="hover:border-primary transition-colors">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                                    <Box className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono font-medium">{item.customId}</span>
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {t('search.in_inventory', 'in')} {item.inventoryTitle}
                                                        </Badge>
                                                        {item.category && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {item.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {item.preview && (
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {item.preview}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </CardContent>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                            {results.hasMoreItems && (
                                <div className="flex justify-center mt-6">
                                    <Button 
                                        variant="outline" 
                                        onClick={loadMoreItems}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                        {t('search.load_more', 'Load More')}
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Users */}
                    {results.users && results.users.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <User className="h-6 w-6 text-primary" />
                                <h3 className="text-2xl font-bold">{t('search.users', 'Users')}</h3>
                                <Badge variant="secondary">{results.users.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.users.map(user => (
                                    <a key={user.id} href={`/user/${user.id}`} className="block group">
                                        <Card className="hover:border-primary transition-colors">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                    <AvatarFallback>
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </CardContent>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* No results message for category-only search */}
                    {results.inventories.length === 0 && results.items.length === 0 && activeCategory && (
                        <div className="text-center py-12">
                            <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />
                            <h2 className="text-xl font-medium text-muted-foreground">
                                {t('search.no_category_results', 'No inventories found in this category')}
                            </h2>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-20">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />
                    <h2 className="text-xl font-medium text-muted-foreground">
                        {t('search.start_typing', 'Enter a keyword to start searching')}
                    </h2>
                </div>
            )}
        </div>
    );
}
