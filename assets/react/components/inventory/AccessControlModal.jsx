import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, UserPlus, X, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common/useConfirm';

export default function AccessControlModal({ inventoryId, initialSharedUsers = [], open, onOpenChange }) {
    const [sharedUsers, setSharedUsers] = useState(initialSharedUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [ConfirmDialog, confirm] = useConfirm();

    // Sorting State
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    useEffect(() => {
        setSharedUsers(initialSharedUsers);
    }, [initialSharedUsers]);

    // Handle Sorting
    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir('asc');
        }
    };

    const sortedUsers = useMemo(() => {
        return [...sharedUsers].sort((a, b) => {
            const valA = (a[sortBy] || '').toLowerCase();
            const valB = (b[sortBy] || '').toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sharedUsers, sortBy, sortDir]);

    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { headers: { 'Accept': 'application/json' } });
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
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                setSharedUsers([...sharedUsers, user]);
                setSearchResults(searchResults.filter(u => u.id !== user.id));
                setSearchQuery('');
                toast.success(t('access.user_added', 'User added successfully'));
            } else {
                const err = await res.json();
                toast.error(err.detail || err.error || err.title || t('error.add_user', 'Failed to add user'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('error.add_user', 'Error adding user'));
        }
    };

    const handleRemoveUser = async (userId) => {
        if (!await confirm({
            title: t('confirm.remove_access', 'Revoke access?'),
            description: t('confirm.remove_access_desc', 'This user will no longer be able to access this inventory.'),
            confirmText: t('action.revoke', 'Revoke Access'),
            variant: 'destructive'
        })) return;

        try {
            const res = await fetch(`/inventory/${inventoryId}/access/${userId}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                setSharedUsers(sharedUsers.filter(u => u.id !== userId));
                toast.success(t('access.user_removed', 'Access revoked'));
            } else {
                const err = await res.json();
                toast.error(err.detail || err.error || err.title || t('error.remove_user', 'Failed to remove user'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('error.remove_user', 'Error removing user'));
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* Increased Size & Responsive: w-full sm:max-w-3xl h-[80vh] */}
                <DialogContent className="w-[95%] sm:max-w-3xl max-h-[85vh] flex flex-col p-6 gap-6 overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-xl">{t('access.title', 'Manage Access')}</DialogTitle>
                        <DialogDescription>
                            {t('access.desc', 'Invite users to collaborate on this inventory.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-6 flex-1 overflow-hidden">
                        {/* Search Section */}
                        <div className="relative flex-shrink-0 z-20">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                                <div className="absolute top-12 left-0 w-full bg-popover text-popover-foreground border rounded-md shadow-xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-0"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                                                <UserPlus className="h-4 w-4 mr-2" /> Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <div className="absolute top-12 left-0 z-10 w-full p-4 text-sm text-center text-muted-foreground bg-background border rounded-md shadow-sm">
                                    {t('access.no_results', 'No users found')}
                                </div>
                            )}
                        </div>

                        {/* Shared Users Table */}
                        <div className="flex flex-col flex-1 overflow-hidden border rounded-md">
                            <div className="flex items-center justify-between p-3 bg-muted/40 border-b">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {t('access.shared_with', 'Shared with')}
                                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs border">
                                        {sharedUsers.length}
                                    </span>
                                </h4>
                            </div>

                            <div className="flex-1 overflow-auto">
                                {sharedUsers.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-8">
                                        <UserPlus className="h-12 w-12 mb-3 stroke-1" />
                                        <p className="text-lg font-medium">{t('access.empty', 'No one yet')}</p>
                                        <p className="text-sm">{t('access.empty_desc', 'Search above to invite collaborators')}</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead
                                                    className="cursor-pointer hover:bg-muted/80 transition-colors w-[40%]"
                                                    onClick={() => handleSort('name')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Name
                                                        {sortBy === 'name' ? (
                                                            sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead
                                                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                                                    onClick={() => handleSort('email')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Email
                                                        {sortBy === 'email' ? (
                                                            sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedUsers.map(user => (
                                                <TableRow key={user.id} className="group">
                                                    <TableCell>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatarUrl} />
                                                            <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleRemoveUser(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Revoke
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </>
    );
}
