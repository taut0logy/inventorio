import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, UserPlus, X, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AccessControlModal({ inventoryId, initialSharedUsers = [], open, onOpenChange }) {
    const [sharedUsers, setSharedUsers] = useState(initialSharedUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
        setSharedUsers(initialSharedUsers);
    }, [initialSharedUsers]);

    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setIsSearching(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out already shared users
                    setSearchResults(data.filter(u => !sharedUsers.some(s => s.id === u.id)));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, sharedUsers]);

    const handleAddUser = async (user) => {
        try {
            const res = await fetch(`/inventory/${inventoryId}/access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            
            if (res.ok) {
                setSharedUsers([...sharedUsers, user]);
                setSearchResults(searchResults.filter(u => u.id !== user.id));
                setSearchQuery('');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add user');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding user');
        }
    };

    const handleRemoveUser = async (userId) => {
        if (!confirm(t('confirm.remove_access', 'Revoke access for this user?'))) return;

        try {
            const res = await fetch(`/inventory/${inventoryId}/access/${userId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                setSharedUsers(sharedUsers.filter(u => u.id !== userId));
            } else {
                alert('Failed to remove user');
            }
        } catch (e) {
            console.error(e);
            alert('Error removing user');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('access.title', 'Manage Access')}</DialogTitle>
                    <DialogDescription>
                        {t('access.desc', 'Invite users to collaborate on this inventory.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Section */}
                    <div className="space-y-2 relative">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('access.search_placeholder', 'Search users by name or email...')}
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-md mt-1 max-h-[200px] overflow-y-auto">
                                {searchResults.map(user => (
                                    <div 
                                        key={user.id} 
                                        className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                        onClick={() => handleAddUser(user)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                            <div className="absolute z-10 w-full p-2 text-sm text-center text-muted-foreground bg-background border rounded-md">
                                {t('access.no_results', 'No users found')}
                            </div>
                        )}
                    </div>

                    {/* Shared Users List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('access.shared_with', 'Shared with')}</h4>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {sharedUsers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-4">
                                    <UserPlus className="h-8 w-8 mb-2" />
                                    <p className="text-sm">{t('access.empty', 'No one yet')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sharedUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveUser(user.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
