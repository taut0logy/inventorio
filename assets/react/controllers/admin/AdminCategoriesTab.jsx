import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    MoreHorizontal, Trash2, Search, Loader2, RefreshCcw, XCircle, Plus, Pencil 
} from 'lucide-react';
import { TrashToggle } from '@/components/common/TrashToggle';
import { t } from '@/lib/i18n';
import { useConfirm } from '@/components/common/useConfirm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'; // Or Dialog? Using Sheet for consistency
import { Label } from '@/components/ui/label';

export default function AdminCategoriesTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, pages: 1 });
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [ConfirmDialog, confirm] = useConfirm();
    
    // Form State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', iconUrl: '' });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: 10, q: search, deleted: showDeleted ? '1' : '0', sort: 'name', dir: 'asc'
            });
            const res = await fetch(`/api/admin/categories?${params}`);
            const data = await res.json();
            setItems(data.data);
            setMeta(data.meta);
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, showDeleted]);

    useEffect(() => {
        const timer = setTimeout(fetchItems, 300);
        return () => clearTimeout(timer);
    }, [fetchItems]);

    const handleSelectAll = (checked) => {
        if (checked) setSelectedIds(items.map(i => i.id));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id, checked) => {
        if (checked) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds(prev => prev.filter(x => x !== id));
    };

    const handleDelete = async (item) => {
        if (!await confirm({
            title: t('admin.confirm.delete_category', 'Delete Category?'),
            description: t('admin.confirm.delete_category_desc', 'Are you sure? This will soft-delete the category.'),
            confirmText: t('action.delete', 'Delete'),
            variant: 'destructive'
        })) return;

        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/admin/categories/${item.id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                setSelectedIds(prev => prev.filter(id => id !== item.id));
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleRestore = async (item) => {
        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/admin/categories/${item.id}/restore`, { method: 'POST' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                setSelectedIds(prev => prev.filter(id => id !== item.id));
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handlePermanentDelete = async (item) => {
        if (!await confirm({
            title: t('admin.confirm.permanent_delete', 'Delete Forever?'),
            description: t('admin.confirm.permanent_delete_category_desc', 'This cannot be undone. Category must be empty.'),
            confirmText: t('action.permanent_delete', 'Delete Forever'),
            variant: 'destructive'
        })) return;

        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/admin/categories/${item.id}/permanent`, { method: 'DELETE' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                setSelectedIds(prev => prev.filter(id => id !== item.id));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete');
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingItem ? `/api/admin/categories/${editingItem.id}` : '/api/admin/categories';
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                setIsSheetOpen(false);
                setEditingItem(null);
                setFormData({ name: '', iconUrl: '' });
                fetchItems();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save');
            }
        } catch (e) { console.error(e); }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', iconUrl: '' });
        setIsSheetOpen(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, iconUrl: item.iconUrl || '' });
        setIsSheetOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!await confirm({
            title: t('admin.bulk.delete', 'Bulk Delete'),
            description: `Delete ${selectedIds.length} categories?`,
            confirmText: 'Delete',
            variant: 'destructive'
        })) return;
        
        try {
           const res = await fetch('/api/admin/categories/bulk/delete', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({ ids: selectedIds })
           });
           if (res.ok) {
               fetchItems();
               setSelectedIds([]);
           }
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                     <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('admin.search_categories', 'Search categories...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-[300px]"
                        />
                    </div>
                    <TrashToggle showDeleted={showDeleted} onToggle={() => { setShowDeleted(!showDeleted); setPage(1); }} />
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('action.create', 'Create Category')}
                </Button>
            </div>

            {selectedIds.length > 0 && !showDeleted && (
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
                     <span className="text-sm font-medium px-2">{selectedIds.length} selected</span>
                     <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                         <Trash2 className="mr-2 h-4 w-4" /> Delete
                     </Button>
                </div>
            )}

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={items.length > 0 && selectedIds.length === items.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Icon</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Inventories</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : items.length === 0 ? (
                             <TableRow><TableCell colSpan={6} className="h-24 text-center">No results</TableCell></TableRow>
                        ) : (
                            items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedIds.includes(item.id)}
                                            onCheckedChange={(c) => handleSelectOne(item.id, c)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {item.iconUrl && <img src={item.iconUrl} alt="" className="w-6 h-6 object-cover rounded" />}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.inventoryCount}</TableCell>
                                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {showDeleted ? (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleRestore(item)}>
                                                            <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handlePermanentDelete(item)}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Delete Forever
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openEdit(item)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingItem ? 'Edit Category' : 'Create Category'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon URL</Label>
                            <Input 
                                id="icon" 
                                value={formData.iconUrl} 
                                onChange={e => setFormData({...formData, iconUrl: e.target.value})} 
                            />
                        </div>
                        <SheetFooter>
                            <Button type="submit">Save</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
            <ConfirmDialog />
        </div>
    );
}
