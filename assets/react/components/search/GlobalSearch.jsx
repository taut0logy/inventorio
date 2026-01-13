import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package, Box, Loader2, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { t } from '@/lib/i18n';

export default function GlobalSearch({ className = '' }) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState({ inventories: [], items: [], users: [], total: 0 });
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Debounced search
    const performSearch = useCallback(async (searchQuery) => {
        if (searchQuery.length < 2) {
            setResults({ inventories: [], items: [], users: [], total: 0 });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setResults({ inventories: [], items: [], total: 0 });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle input change with debounce
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length >= 2) {
            debounceRef.current = setTimeout(() => {
                performSearch(query);
            }, 300);
        } else {
            setResults({ inventories: [], items: [], total: 0 });
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, performSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        } else if (e.key === 'Enter') {
            // Navigate to search page on enter
            if (query.trim()) {
                setIsOpen(false);
                window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
        }
    };

    const handleResultClick = (url) => {
        setIsOpen(false);
        setQuery('');
        window.location.href = url;
    };

    const clearSearch = () => {
        setQuery('');
        setResults({ inventories: [], items: [], total: 0 });
        inputRef.current?.focus();
    };

    const showDropdown = isOpen && (query.length >= 2 || isLoading);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={t('search.placeholder', 'Search inventories and items...')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 pr-8 w-[280px] lg:w-[320px]"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t('search.loading', 'Searching...')}
                        </div>
                    ) : results.total === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            {query.length < 2 
                                ? t('search.min_chars', 'Type at least 2 characters')
                                : t('search.no_results', 'No results found')
                            }
                        </div>
                    ) : (
                        <>
                            {/* Inventories Section */}
                            {results.inventories.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                                        <Package className="h-3.5 w-3.5" />
                                        {t('search.inventories', 'Inventories')}
                                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                                            {results.inventories.length}
                                        </Badge>
                                    </div>
                                    {results.inventories.map((inv) => (
                                        <button
                                            key={inv.id}
                                            onClick={() => handleResultClick(`/inventory/${inv.id}`)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors flex items-start gap-3"
                                        >
                                            {inv.imageUrl ? (
                                                <img 
                                                    src={inv.imageUrl} 
                                                    alt="" 
                                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{inv.title}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{inv.category?.name}</span>
                                                    <span>•</span>
                                                    <span>{inv.itemCount} {t('inventory.items_count', 'items')}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Items Section */}
                            {results.items.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                                        <Box className="h-3.5 w-3.5" />
                                        {t('search.items', 'Items')}
                                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                                            {results.items.length}
                                        </Badge>
                                    </div>
                                    {results.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleResultClick(`/inventory/${item.inventoryId}`)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                                        >
                                            <div className="font-medium font-mono text-sm">{item.customId}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {item.preview && <span>{item.preview} • </span>}
                                                <span className="text-primary">{t('search.in_inventory', 'in')} {item.inventoryTitle}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Users Section */}
                            {results.users && results.users.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" />
                                        {t('search.users', 'Users')}
                                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                                            {results.users.length}
                                        </Badge>
                                    </div>
                                    {results.users.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleResultClick(`/user/${user.id}`)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-3"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                <AvatarFallback>
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{user.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* View All Link */}
                    {query.length >= 2 && (
                        <div className="p-2 border-t bg-muted/20">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                                }}
                                className="w-full text-center text-sm text-primary hover:underline py-1"
                            >
                                {t('search.view_all', 'View all results')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
