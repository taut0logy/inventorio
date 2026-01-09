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
    MoreHorizontal, Trash2, Search, Loader2, RefreshCcw, XCircle, Plus, Pencil, Tag 
} from 'lucide-react';
import { TrashToggle } from '@/components/common/TrashToggle';
import { t } from '@/lib/i18n';
import { useConfirm } from '@/components/common/useConfirm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

export default function AdminTagsTab() {
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
    const [formData, setFormData] = useState({ name: '', isPredefined: false });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: 10, q: search, deleted: showDeleted ? '1' : '0', sort: 'name', dir: 'asc'
            });
            const res = await fetch(`/api/admin/tags?${params}`);
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
            title: t('admin.confirm.delete_tag', 'Delete Tag?'),
            description: t('admin.confirm.delete_tag_desc', 'Are you sure? This will soft-delete the tag.'),
            confirmText: t('action.delete', 'Delete'),
            variant: 'destructive'
        })) return;

        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/admin/tags/${item.id}`, { method: 'DELETE' });
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
            const res = await fetch(`/api/admin/tags/${item.id}/restore`, { method: 'POST' });
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
            description: t('admin.confirm.permanent_delete_tag_desc', 'This cannot be undone. Tag must not be used by any items.'),
            confirmText: t('action.permanent_delete', 'Delete Forever'),
            variant: 'destructive'
        })) return;

        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/admin/tags/${item.id}/permanent`, { method: 'DELETE' });
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
        const url = editingItem ? `/api/admin/tags/${editingItem.id}` : '/api/admin/tags';
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
                setFormData({ name: '', isPredefined: false });
                fetchItems();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save');
            }
        } catch (e) { console.error(e); }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', isPredefined: false });
        setIsSheetOpen(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, isPredefined: item.isPredefined });
        setIsSheetOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!await confirm({
            title: t('admin.bulk.delete', 'Bulk Delete'),
            description: `Delete ${selectedIds.length} tags?`,
            confirmText: 'Delete',
            variant: 'destructive'
        })) return;
        
        try {
           const res = await fetch('/api/admin/tags/bulk/delete', {
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
                            placeholder={t('admin.search_tags', 'Search tags...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-[300px]"
                        />
                    </div>
                    <TrashToggle showDeleted={showDeleted} onToggle={() => { setShowDeleted(!showDeleted); setPage(1); }} />
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('action.create', 'Create Tag')}
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
                            <TableHead>Tag</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Usage</TableHead>
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
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" /> {item.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.isPredefined ? (
                                            <Badge variant="secondary">Predefined</Badge>
                                        ) : (
                                            <Badge variant="outline">User Generated</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.usageCount} items</TableCell>
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
                        <SheetTitle>{editingItem ? 'Edit Tag' : 'Create Tag'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="tag-name">Name</Label>
                            <Input 
                                id="tag-name" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="is-predefined" 
                                checked={formData.isPredefined} 
                                onCheckedChange={c => setFormData({...formData, isPredefined: c})} 
                            />
                            <Label htmlFor="is-predefined">Is Predefined (Global)</Label>
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
