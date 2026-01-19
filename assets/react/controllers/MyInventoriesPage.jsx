import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Package,
    Search,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Grid,
    List as ListIcon,
    RefreshCcw,
    XCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import InventorySheet from '@/components/inventory/InventorySheet';
import { TrashToggle } from '@/components/common/TrashToggle';
import { useConfirm } from '@/components/common/useConfirm';

export default function MyInventoriesPage({
    inventories = [],
    sharedInventories = [],
    categories = [],
    createEndpoint,
    showEndpoint,
    showDeleted = false
}) {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [activeTab, setActiveTab] = useState('owned'); // 'owned' or 'shared'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [ConfirmDialog, confirm] = useConfirm();
    const [editingInventory, setEditingInventory] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleDeletedMode = () => {
        const url = new URL(window.location);
        if (showDeleted) {
            url.searchParams.delete('deleted');
        } else {
            url.searchParams.set('deleted', '1');
        }
        window.location.href = url.toString();
    };

    const handleRestore = async (id) => {
        if (!await confirm({
            title: t('confirm.restore', 'Restore Inventory?'),
            description: t('confirm.restore_desc', 'Are you sure you want to restore this inventory?'),
            confirmText: t('action.restore', 'Restore'),
            variant: 'default'
        })) return;
        try {
            const res = await fetch(`/inventory/${id}/restore`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                toast.success(t('inventory.action.restored', 'Inventory restored'));
                window.location.reload();
            } else {
                const err = await res.json();
                toast.error(err.detail || err.error || err.title || t('error.action_failed', 'Failed to restore'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('error.network', 'Network error'));
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!await confirm({
            title: t('confirm.permanent_delete', 'Delete Forever?'),
            description: t('confirm.permanent_delete_desc', 'This action cannot be undone.'),
            confirmText: t('action.permanent_delete', 'Delete Forever'),
            variant: 'destructive'
        })) return;
        try {
            const res = await fetch(`/inventory/${id}/permanent`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                toast.success(t('inventory.action.deleted_forever', 'Inventory permanently deleted'));
                window.location.reload();
            } else {
                const err = await res.json();
                toast.error(err.detail || err.error || err.title || t('error.action_failed', 'Failed to delete permanently'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('error.network', 'Network error'));
        }
    };

    const sourceInventories = showDeleted ? inventories : (activeTab === 'owned' ? inventories : sharedInventories);

    const filteredInventories = sourceInventories.filter(inv =>
        inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredInventories.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredInventories.map(inv => inv.id));
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchDelete = async () => {
        if (!await confirm({
            title: t('confirm.batch_delete', 'Delete Items?'),
            description: t('confirm.batch_delete_desc', `Are you sure you want to delete ${selectedIds.length} items?`),
            confirmText: t('action.delete', 'Delete')
        })) return;

        try {
            const response = await fetch('/inventory/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                toast.success(t('inventory.action.batch_deleted', 'Items deleted'));
                window.location.reload();
            } else {
                const err = await response.json();
                toast.error(err.detail || err.error || err.title || t('error.action_failed', 'Failed to delete items'));
            }
        } catch (error) {
            console.error('Batch delete error:', error);
            toast.error(t('error.network', 'An error occurred'));
        }
    };

    const handleTabChange = (val) => {
        setActiveTab(val);
        setSelectedIds([]);
        setSearchQuery('');
    };

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {t('my_inv.title', 'My Inventories')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('my_inv.no_inventories_desc', 'Create your first inventory to get started.')}
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <TrashToggle showDeleted={showDeleted} onToggle={toggleDeletedMode} />
                    {!showDeleted && (
                        <InventorySheet
                            categories={categories}
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('home.hero.create', 'Create Inventory')}
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="bg-muted/50 border rounded-md p-2 mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium ml-2">
                        {selectedIds.length} {t('inventory.selected', 'selected')}
                    </span>
                    <div className="flex gap-2">
                        {activeTab === 'owned' && (
                            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('action.delete', 'Delete')}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <Card className="mb-8">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4">
                        {!showDeleted && (
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList>
                                    <TabsTrigger value="owned">{t('my_inv.owned', 'Owned by Me')}</TabsTrigger>
                                    <TabsTrigger value="shared">{t('my_inv.shared', 'Shared with Me')}</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('nav.search', 'Search...')}
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center border rounded-md p-1">
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setViewMode('list')}
                                >
                                    <ListIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredInventories.length > 0 ? (
                        viewMode === 'list' ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                {activeTab === 'owned' && (
                                                    <Checkbox
                                                        checked={filteredInventories.length > 0 && selectedIds.length === filteredInventories.length}
                                                        onCheckedChange={toggleSelectAll}
                                                    />
                                                )}
                                            </TableHead>
                                            <TableHead>{t('table.title', 'Title')}</TableHead>
                                            <TableHead className="hidden md:table-cell">{t('table.category', 'Category')}</TableHead>
                                            <TableHead className="hidden sm:table-cell">{t('table.items', 'Items')}</TableHead>
                                            <TableHead className="hidden lg:table-cell">Visibility</TableHead>
                                            <TableHead className="hidden lg:table-cell">{t('table.created', 'Created')}</TableHead>
                                            <TableHead className="w-[80px] text-right">{t('table.actions', 'Actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInventories.map((inventory) => (
                                            <TableRow key={inventory.id} className="group" data-state={selectedIds.includes(inventory.id) ? "selected" : undefined}>
                                                <TableCell>
                                                    {activeTab === 'owned' && (
                                                        <Checkbox
                                                            checked={selectedIds.includes(inventory.id)}
                                                            onCheckedChange={() => toggleSelectOne(inventory.id)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <a href={showEndpoint.replace('__id__', inventory.id)} className="hover:underline">
                                                        {inventory.title}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant="outline" className="font-normal">
                                                        {inventory.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">{inventory.itemCount}</TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <Badge variant={inventory.isPublic ? "secondary" : "outline"}>
                                                        {inventory.isPublic ? "Public" : "Private"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                    {inventory.createdAt}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Open menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {showDeleted ? (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleRestore(inventory.id)}>
                                                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                                                        {t('action.restore', 'Restore')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive" onClick={() => handlePermanentDelete(inventory.id)}>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        {t('action.permanent_delete', 'Delete Forever')}
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem asChild>
                                                                        <a href={showEndpoint.replace('__id__', inventory.id)}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View
                                                                        </a>
                                                                    </DropdownMenuItem>
                                                                    {activeTab === 'owned' && (
                                                                        <>
                                                                            <DropdownMenuItem onSelect={() => setEditingInventory(inventory)}>
                                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleBatchDelete([inventory.id])}>
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredInventories.map((inventory) => (
                                    <Card key={inventory.id} className="hover:bg-accent/50 transition-colors">
                                        <CardHeader className="p-4">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline">{inventory.category}</Badge>
                                                {inventory.isPublic ? (
                                                    <Badge variant="secondary" className="text-[10px] h-5">Public</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] h-5">Private</Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg mt-2 leading-tight">
                                                <a href={showEndpoint.replace('__id__', inventory.id)} className="hover:underline">
                                                    {inventory.title}
                                                </a>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                                            <div className="flex justify-between items-center mt-2">
                                                <span>{inventory.itemCount} items</span>
                                                <span className="text-xs">{inventory.createdAt}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t('home.no_inventories', 'No inventories found')}</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                {activeTab === 'shared'
                                    ? t('my_inv.no_shared', 'No inventories have been shared with you.')
                                    : t('inventory.empty_description', 'Start by adding your first inventory.')
                                }
                            </p>
                            {activeTab === 'owned' && !showDeleted && (
                                <InventorySheet categories={categories} />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            <ConfirmDialog />

            {/* Edit Sheet */}
            {editingInventory && (
                <InventorySheet
                    categories={categories}
                    inventory={editingInventory}
                    open={!!editingInventory}
                    onOpenChange={(open) => !open && setEditingInventory(null)}
                />
            )}
        </div>
    );
}
