import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    List as ListIcon
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
import CreateInventorySheet from '../components/inventory/CreateInventorySheet';

export default function MyInventoriesPage({ 
    inventories = [], 
    categories = [],
    createEndpoint,
    showEndpoint
}) {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const filteredInventories = inventories.filter(inv => 
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
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

        try {
            const response = await fetch('/inventory/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                alert('Failed to delete items');
            }
        } catch (error) {
            console.error('Batch delete error:', error);
            alert('An error occurred');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
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
                    <CreateInventorySheet categories={categories} />
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="bg-muted/50 border rounded-md p-2 mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium ml-2">
                        {selectedIds.length} {t('inventory.selected', 'selected')}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('action.delete', 'Delete')}
                        </Button>
                    </div>
                </div>
            )}

            <Card className="mb-8">
                <CardHeader className="pb-3">
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
                </CardHeader>
                <CardContent>
                    {filteredInventories.length > 0 ? (
                        viewMode === 'list' ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={selectedIds.length === filteredInventories.length && filteredInventories.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
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
                                                    <Checkbox 
                                                        checked={selectedIds.includes(inventory.id)}
                                                        onCheckedChange={() => toggleSelectOne(inventory.id)}
                                                    />
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
                                                            <DropdownMenuItem asChild>
                                                                <a href={showEndpoint.replace('__id__', inventory.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
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
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t('home.no_inventories', 'No inventories yet')}</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                {t('inventory.empty_description', 'Start by adding your first inventory.')}
                            </p>
                            <CreateInventorySheet categories={categories} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
