import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
    Package, 
    Eye, 
    Heart, 
    Box, 
    Calendar, 
    Lock, 
    Globe, 
    Trash2,
    Activity,
    RefreshCcw,
    Search
} from 'lucide-react';
import { TrashToggle } from '@/components/common/TrashToggle';
import { t } from '@/lib/i18n';

export default function UserProfilePage({
    profileUser,
    stats,
    inventories = [],
    isOwner,
    isAdmin,
    canSeePrivate,
    canSeeDeleted,
    currentVisibility,
    showDeleted
}) {
    const [visibility, setVisibility] = useState(currentVisibility);
    const [deletedMode, setDeletedMode] = useState(showDeleted);
    const [searchQuery, setSearchQuery] = useState('');

    // Client-side filtering of inventories
    const filteredInventories = useMemo(() => {
        if (!searchQuery.trim()) return inventories;
        const query = searchQuery.toLowerCase();
        return inventories.filter(inv => 
            inv.title.toLowerCase().includes(query) ||
            inv.category?.name?.toLowerCase().includes(query) ||
            inv.description?.toLowerCase().includes(query)
        );
    }, [inventories, searchQuery]);

    const handleVisibilityChange = (value) => {
        setVisibility(value);
        const url = new URL(window.location);
        url.searchParams.set('visibility', value);
        if (deletedMode) url.searchParams.set('deleted', '1');
        else url.searchParams.delete('deleted');
        window.location.href = url.toString();
    };

    const handleDeletedToggle = () => {
        const newMode = !deletedMode;
        setDeletedMode(newMode);
        const url = new URL(window.location);
        url.searchParams.set('visibility', visibility);
        if (newMode) url.searchParams.set('deleted', '1');
        else url.searchParams.delete('deleted');
        window.location.href = url.toString();
    };

    const handleRestore = async (id) => {
        if (!confirm(t('confirm.restore', 'Are you sure you want to restore this inventory?'))) return;
        try {
            const res = await fetch(`/inventory/${id}/restore`, { method: 'POST' });
            if (res.ok) window.location.reload();
            else alert('Failed to restore');
        } catch (e) {
            console.error(e);
            alert('Error restoring inventory');
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profileUser.avatarUrl} alt={profileUser.name} />
                    <AvatarFallback className="text-3xl font-bold bg-primary/10">
                        {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{profileUser.name}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {t('profile.joined', 'Joined')} {profileUser.createdAt}
                        </span>
                        {isOwner && (
                            <Badge variant="secondary">{t('profile.you', 'You')}</Badge>
                        )}
                        {isAdmin && !isOwner && (
                            <Badge variant="outline" className="border-primary text-primary">
                                {t('profile.viewing_as_admin', 'Admin View')}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.inventoryCount}</p>
                                <p className="text-sm text-muted-foreground">{t('profile.inventories', 'Inventories')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Heart className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalLikes}</p>
                                <p className="text-sm text-muted-foreground">{t('profile.likes', 'Likes')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Eye className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{t('profile.views', 'Views')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Box className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalItems}</p>
                                <p className="text-sm text-muted-foreground">{t('profile.items', 'Items')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="inventories" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="inventories" className="gap-2">
                        <Package className="h-4 w-4" />
                        {t('profile.tab.inventories', 'Inventories')}
                        <Badge variant="secondary" className="ml-1">{inventories.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        {t('profile.tab.activity', 'Activity')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventories" className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('profile.search_inventories', 'Search inventories...')}
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {canSeePrivate && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{t('profile.visibility', 'Visibility')}:</span>
                                    <Select value={visibility} onValueChange={handleVisibilityChange}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <span className="flex items-center gap-2">All</span>
                                            </SelectItem>
                                            <SelectItem value="public">
                                                <span className="flex items-center gap-2">
                                                    <Globe className="h-3.5 w-3.5" /> Public
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="private">
                                                <span className="flex items-center gap-2">
                                                    <Lock className="h-3.5 w-3.5" /> Private
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {canSeeDeleted && (
                                    <TrashToggle showDeleted={deletedMode} onToggle={handleDeletedToggle} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Inventory Table */}
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>{t('table.title', 'Title')}</TableHead>
                                    <TableHead>{t('table.category', 'Category')}</TableHead>
                                    <TableHead className="text-center">{t('table.items', 'Items')}</TableHead>
                                    <TableHead className="text-center">{t('table.likes', 'Likes')}</TableHead>
                                    <TableHead className="text-center">{t('table.views', 'Views')}</TableHead>
                                    <TableHead>{t('table.created', 'Created')}</TableHead>
                                    {(canSeePrivate || deletedMode) && <TableHead className="w-[80px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventories.length > 0 ? (
                                    filteredInventories.map(inv => (
                                        <TableRow key={inv.id} className={inv.isDeleted ? 'opacity-60' : ''}>
                                            <TableCell>
                                                {inv.category?.icon ? (
                                                    <img src={inv.category.icon} alt="" className="w-6 h-6" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <a 
                                                    href={`/inventory/${inv.id}`} 
                                                    className="font-medium hover:underline flex items-center gap-2"
                                                >
                                                    {inv.title}
                                                    {inv.isPublic ? (
                                                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                    ) : (
                                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                    {inv.isDeleted && (
                                                        <Badge variant="destructive" className="text-[10px]">Deleted</Badge>
                                                    )}
                                                </a>
                                                {inv.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                        {inv.description}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{inv.category?.name || 'Other'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{inv.itemCount}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="flex items-center justify-center gap-1">
                                                    <Heart className="h-3.5 w-3.5 text-red-500" />
                                                    {inv.likeCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">{inv.viewCount.toLocaleString()}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{inv.createdAt}</TableCell>
                                            {(canSeePrivate || deletedMode) && (
                                                <TableCell>
                                                    {inv.isDeleted && canSeeDeleted && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleRestore(inv.id)}
                                                        >
                                                            <RefreshCcw className="h-4 w-4 mr-1" />
                                                            {t('action.restore', 'Restore')}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-muted-foreground">
                                                    {t('profile.no_inventories', 'No inventories found')}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">
                                    {t('profile.activity_coming_soon', 'Activity log coming soon')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
