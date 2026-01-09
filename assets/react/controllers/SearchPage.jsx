import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Package, Box, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function SearchPage({ initialQuery = '' }) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState({ inventories: [], items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const performSearch = async (q) => {
        if (!q || q.length < 2) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=50`);
            const data = await res.json();
            setResults(data);
            setSearched(true);
            
            const url = new URL(window.location);
            url.searchParams.set('q', q);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        performSearch(query);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">{t('search.title', 'Search')}</h1>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="flex gap-4 mb-12">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search.placeholder', 'Search inventories, items, tags...')}
                        className="pl-10 h-12 text-lg"
                        autoFocus
                    />
                </div>
                <Button type="submit" size="lg" disabled={loading || query.length < 2}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('search.submit', 'Search')}
                </Button>
            </form>

            {/* Results */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : searched ? (
                <div className="space-y-12">
                     <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-semibold text-muted-foreground">
                            {results.total === 0 
                                ? t('search.no_results_for', { query }, `No results for "${query}"`)
                                : t('search.results_for', { count: results.total, query }, `Found ${results.total} results for "${query}"`)
                            }
                        </h2>
                    </div>

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
                        </section>
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
