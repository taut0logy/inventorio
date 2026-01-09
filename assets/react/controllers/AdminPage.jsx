import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    MoreHorizontal, 
    Shield, 
    ShieldOff, 
    Trash2, 
    Ban, 
    CheckCircle, 
    Search,
    Loader2,
    CheckSquare
} from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AdminPage({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, pages: 1 });
    const [actionLoading, setActionLoading] = useState(null); // id of user being processed
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 10,
                q: search
            });
            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();
            setUsers(data.data);
            setMeta(data.meta);
            setSelectedIds([]); // Reset selection on page change
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleSelectAll = (checked) => {
        if (checked) {
            // Select all users on current page
            const selectable = users.map(u => u.id);
            setSelectedIds(selectable);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(x => x !== id));
        }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;

        let confirmMsg = '';
        let url = '';
        
        switch (action) {
            case 'block':
                confirmMsg = t('admin.bulk.confirm.block', { count: selectedIds.length }, `Block ${selectedIds.length} users?`);
                url = '/api/admin/users/bulk/block';
                break;
            case 'unblock':
                confirmMsg = t('admin.bulk.confirm.unblock', { count: selectedIds.length }, `Unblock ${selectedIds.length} users?`);
                url = '/api/admin/users/bulk/unblock';
                break;
            case 'delete':
                confirmMsg = t('admin.bulk.confirm.delete', { count: selectedIds.length }, `Delete ${selectedIds.length} users?`);
                url = '/api/admin/users/bulk/delete';
                break;
        }

        if (!confirm(confirmMsg)) return;

        setBulkLoading(true);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.logoutRequired) {
                    window.location.reload();
                    return;
                }

                // Refresh list
                fetchUsers();
                setSelectedIds([]);
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBlock = async (user) => {
        if (!confirm(t('admin.confirm.block', 'Are you sure?'))) return;
        
        setActionLoading(user.id);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/block`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();

                if (data.logoutRequired) {
                    window.location.reload();
                    return;
                }

                setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: data.isBlocked } : u));
            }
        } catch (error) {
            console.error('Error blocking user:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRole = async (user) => {
        setActionLoading(user.id);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/role`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                setUsers(users.map(u => u.id === user.id ? { ...u, roles: data.roles } : u));
            }
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(t('admin.confirm.delete', 'Are you sure you want to delete this user?'))) return;

        setActionLoading(user.id);
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            if (response.ok) {
                const data = await response.json();

                if (data.logoutRequired) {
                    window.location.reload();
                    return;
                }

                setUsers(users.filter(u => u.id !== user.id));
                setSelectedIds(prev => prev.filter(id => id !== user.id));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const selectableUsersCount = users.length;
    const isAllSelected = selectableUsersCount > 0 && selectedIds.length === selectableUsersCount;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.title', 'User Management')}</h1>
                    <p className="text-muted-foreground">
                        {t('admin.users_count', 'Total Users')}: {meta.total}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('admin.search_placeholder', 'Search users...')}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-medium px-2">
                            {t('admin.bulk.selected', { count: selectedIds.length }, `${selectedIds.length} selected`)}
                        </span>
                        <div className="h-4 w-px bg-border mx-1" />
                        
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleBulkAction('delete')}
                            disabled={bulkLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('admin.bulk.delete', 'Delete')}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleBulkAction('block')}
                            disabled={bulkLoading}
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            {t('admin.bulk.block', 'Block')}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleBulkAction('unblock')}
                            disabled={bulkLoading}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('admin.bulk.unblock', 'Unblock')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    disabled={loading || selectableUsersCount === 0}
                                />
                            </TableHead>
                            <TableHead>{t('admin.table.user', 'User')}</TableHead>
                            <TableHead>{t('admin.table.role', 'Role')}</TableHead>
                            <TableHead>{t('admin.table.status', 'Status')}</TableHead>
                            <TableHead>{t('admin.table.created', 'Joined')}</TableHead>
                            <TableHead className="text-right">{t('admin.table.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {t('search.no_results', 'No results found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => {
                                const isAdmin = user.roles.includes('ROLE_ADMIN');
                                const isSelf = currentUser && currentUser.id === user.id;

                                return (
                                    <TableRow key={user.id} data-state={selectedIds.includes(user.id) ? "selected" : undefined}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedIds.includes(user.id)}
                                                onCheckedChange={(checked) => handleSelectOne(user.id, checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isAdmin ? "default" : "secondary"}>
                                                {isAdmin ? t('admin.role.admin', 'Admin') : t('admin.role.user', 'User')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isBlocked ? "destructive" : "outline"} className={user.isBlocked ? "" : "text-green-600 bg-green-50/50 border-green-200"}>
                                                {user.isBlocked ? t('admin.status.blocked', 'Blocked') : t('admin.status.active', 'Active')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {actionLoading === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleRole(user)}
                                                            disabled={isSelf && !isAdmin} 
                                                        >
                                                            {isAdmin ? (
                                                                <>
                                                                    <ShieldOff className="mr-2 h-4 w-4" />
                                                                    {t('admin.action.demote', 'Remove Admin')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    {t('admin.action.promote', 'Make Admin')}
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleBlock(user)}>
                                                            {user.isBlocked ? (
                                                                <>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                                    {t('admin.action.unblock', 'Unblock User')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="mr-2 h-4 w-4 text-orange-600" />
                                                                    {t('admin.action.block', 'Block User')}
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(user)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {t('admin.action.delete', 'Delete User')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {page} of {meta.pages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= meta.pages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
