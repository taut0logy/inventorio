import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Calendar,
    MoreHorizontal,
    Share2,
    Settings,
    MessageSquare,
    Activity,
    Search,
    Filter,
    ArrowLeft,
    Plus,
    Trash2,
    Pencil,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    RefreshCcw,
    XCircle,
    Heart,
    Eye,
    User,
    Package
} from 'lucide-react';
import { TrashToggle } from '@/components/common/TrashToggle';
import { t } from '@/lib/i18n';
import ItemSheet from '@/components/inventory/ItemSheet';
import InventorySettingsSheet from '@/components/inventory/InventorySettingsSheet';
import CommentsSection from '@/components/inventory/CommentsSection';
import AccessControlModal from '@/components/inventory/AccessControlModal';
import { useConfirm } from '@/components/common/useConfirm';

// Default order includes all fields
const DEFAULT_ORDER = [
    'string1', 'string2', 'string3',
    'number1', 'number2', 'number3',
    'text1', 'text2', 'text3',
    'link1', 'link2', 'link3',
    'bool1', 'bool2', 'bool3'
];

// Default: only first 3 visible
const getDefaultFields = () => {
    const fields = {};
    DEFAULT_ORDER.forEach((key, index) => {
        fields[key] = { hidden: index >= 3 };
    });
    return fields;
};

export default function InventoryShowPage({ 
    inventory, 
    currentUser,
    isCreator,
    canAddItem = false,
    canEditInventory = false,
    items = [],
    showDeleted = false,
    likedItemIds = [],
    inventoryLiked = false,
    inventoryLikeCount = 0,
    inventoryViewCount = 0
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [ConfirmDialog, confirm] = useConfirm();
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    // Inventory like state
    const [isInventoryLiked, setIsInventoryLiked] = useState(inventoryLiked);
    const [invLikeCount, setInvLikeCount] = useState(inventoryLikeCount);

    const handleToggleInventoryLike = async () => {
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }
        
        const wasLiked = isInventoryLiked;
        setIsInventoryLiked(!wasLiked);
        setInvLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/inventory/${inventory.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setIsInventoryLiked(data.liked);
            setInvLikeCount(data.likeCount);
        } catch {
            setIsInventoryLiked(wasLiked);
            setInvLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
        }
    };

    // Item likes state
    const [likes, setLikes] = useState(() => {
        const initialLikes = {};
        if (likedItemIds) {
            likedItemIds.forEach(id => { initialLikes[id] = true; });
        }
        return initialLikes;
    });
    const [localCounts, setLocalCounts] = useState(() => {
        const counts = {};
        items.forEach(item => { counts[item.id] = item.likeCount || 0; });
        return counts;
    });

    const handleToggleLike = async (itemId) => {
        const isLiked = !likes[itemId];
        setLikes(prev => ({ ...prev, [itemId]: isLiked }));
        setLocalCounts(prev => ({ 
            ...prev, 
            [itemId]: isLiked ? (prev[itemId] || 0) + 1 : Math.max(0, (prev[itemId] || 0) - 1)
        }));

        try {
            const res = await fetch(`/api/items/${itemId}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLikes(prev => ({ ...prev, [itemId]: data.isLiked }));
            setLocalCounts(prev => ({ ...prev, [itemId]: data.likeCount }));
        } catch (e) {
            setLikes(prev => ({ ...prev, [itemId]: !isLiked }));
            setLocalCounts(prev => ({ 
                ...prev, 
                [itemId]: !isLiked ? (prev[itemId] || 0) + 1 : Math.max(0, (prev[itemId] || 0) - 1)
            }));
        }
    };

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
            title: t('confirm.restore', 'Restore Item?'),
            description: t('confirm.restore_desc', 'Are you sure you want to restore this item?'),
            confirmText: t('action.restore', 'Restore'),
            variant: 'default'
        })) return;
        try {
            const res = await fetch(`/api/items/${id}/restore`, { method: 'POST' });
            if (res.ok) window.location.reload();
            else alert('Failed to restore');
        } catch (e) {
            console.error(e);
            alert('Error restoring item');
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
            const res = await fetch(`/api/items/${id}/permanent`, { method: 'DELETE' });
            if (res.ok) window.location.reload();
            else alert('Failed to delete permanently');
        } catch (e) {
            console.error(e);
            alert('Error deleting item');
        }
    };

    // Stateful config (so settings changes reflect instantly)
    const [fieldsConfig, setFieldsConfig] = useState(() => {
        const config = inventory.customFieldsConfig || {};
        const fields = config?.fields || config;
        const order = (config?.order && config.order.length > 0) ? config.order : DEFAULT_ORDER;
        
        // Apply defaults if no explicit config
        const normalizedFields = {};
        DEFAULT_ORDER.forEach((key, index) => {
            if (fields[key] !== undefined) {
                normalizedFields[key] = fields[key];
            } else {
                normalizedFields[key] = { hidden: index >= 3 };
            }
        });
        
        return { 
            order, 
            fields: normalizedFields,
            sortBy: config?.sortBy || 'customId',
            sortDir: config?.sortDir || 'asc'
        };
    });

    const [idConfig, setIdConfig] = useState(() => {
        return inventory.idGenerationConfig || {};
    });

    // Derived values from state
    const fieldsData = fieldsConfig.fields;
    const fieldsOrder = fieldsConfig.order;

    // Helper to get label
    const getLabel = (key, defaultLabel) => {
        const config = fieldsData[key];
        if (config?.label) {
            return config.label;
        }
        return defaultLabel;
    };

    // Helper to check visibility (default: only first 3 visible)
    const isVisible = (key) => {
        const config = fieldsData[key];
        // If explicit config exists, use it
        if (config?.hidden === true) {
            return false;
        }
        if (config?.hidden === false) {
            return true;
        }
        // No explicit config - default: only first 3 fields visible
        const defaultVisibleFields = ['string1', 'string2', 'string3'];
        return defaultVisibleFields.includes(key);
    };

    // Get ordered visible columns for the table (show ALL unhidden fields)
    const tableColumns = fieldsOrder
        .filter(key => isVisible(key))
        .map(key => {
            const defaults = {
                string1: 'Custom String 1', string2: 'Custom String 2', string3: 'Custom String 3',
                number1: 'Custom Number 1', number2: 'Custom Number 2', number3: 'Custom Number 3',
                text1: 'Custom Text 1', text2: 'Custom Text 2', text3: 'Custom Text 3',
                link1: 'Custom Link 1', link2: 'Custom Link 2', link3: 'Custom Link 3',
                bool1: 'Custom Boolean 1', bool2: 'Custom Boolean 2', bool3: 'Custom Boolean 3',
            };
            return { key, label: getLabel(key, defaults[key] || key) };
        });

    // Map field key to item property
    const getItemValue = (item, key) => {
        if (key === 'customId') return item.customId;
        const propMap = {
            string1: 'customString1Value', string2: 'customString2Value', string3: 'customString3Value',
            number1: 'customNumber1Value', number2: 'customNumber2Value', number3: 'customNumber3Value',
            text1: 'customText1Value', text2: 'customText2Value', text3: 'customText3Value',
            link1: 'customLink1Value', link2: 'customLink2Value', link3: 'customLink3Value',
            bool1: 'customBool1Value', bool2: 'customBool2Value', bool3: 'customBool3Value',
        };
        const prop = propMap[key];
        return prop ? item[prop] : null;
    };

    // Sorting state: initialized from saved config or defaults
    const [sortBy, setSortBy] = useState(() => fieldsConfig.sortBy || 'customId');
    const [sortDir, setSortDir] = useState(() => fieldsConfig.sortDir || 'asc');

    // Save sort order to database
    const saveSortOrder = async (newSortBy, newSortDir) => {
        try {
            const updatedFieldsConfig = {
                ...fieldsConfig,
                sortBy: newSortBy,
                sortDir: newSortDir
            };
            
            await fetch(`/inventory/${inventory.id}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customFieldsConfig: updatedFieldsConfig,
                    idGenerationConfig: idConfig
                })
            });
            
            // Update local state
            setFieldsConfig(updatedFieldsConfig);
        } catch (error) {
            console.error('Failed to save sort order:', error);
        }
    };

    // Handle column header click
    const handleSort = (key) => {
        let newSortBy = key;
        let newSortDir = 'asc';
        
        if (sortBy === key) {
            // Toggle direction
            newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
        }
        
        setSortBy(newSortBy);
        setSortDir(newSortDir);
        
        // Persist to database
        saveSortOrder(newSortBy, newSortDir);
    };

    // Filter and sort items
    const filteredItems = items
        .filter(item => item.customId.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const valA = getItemValue(a, sortBy);
            const valB = getItemValue(b, sortBy);
            
            // Handle nulls
            if (valA == null && valB == null) return 0;
            if (valA == null) return sortDir === 'asc' ? 1 : -1;
            if (valB == null) return sortDir === 'asc' ? -1 : 1;
            
            // Compare based on type
            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
                comparison = valA === valB ? 0 : (valA ? -1 : 1);
            } else {
                comparison = String(valA).localeCompare(String(valB));
            }
            
            return sortDir === 'asc' ? comparison : -comparison;
        });

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map(item => item.id));
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
            const response = await fetch('/api/items/batch-delete', {
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

    const handleDelete = async (id) => {
        if (!await confirm({
            title: t('confirm.delete', 'Delete Item?'),
            description: t('confirm.delete_desc', 'Are you sure you want to delete this item?'),
            confirmText: t('action.delete', 'Delete')
        })) return;

        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background pb-10 px-4 md:px-6 lg:px-8">
            {/* Sticky Header */}
            <header className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <a href="/inventory/">
                                <ArrowLeft className="h-5 w-5" />
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-xl">📦</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold leading-none mb-1">
                                    {inventory.title}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 rounded-sm">
                                        {inventory.category.name}
                                    </Badge>
                                    {inventory.tags && inventory.tags.slice(0, 2).map(tag => (
                                        <Badge key={tag.id} variant="secondary" className="text-[10px] h-4 px-1 rounded-sm">
                                            #{tag.name}
                                        </Badge>
                                    ))}
                                    <span>•</span>
                                    <span>{items.length} {t('inventory.items', 'items')}</span>
                                    {!isCreator && inventory.creator && (
                                        <>
                                            <span>•</span>
                                            <a 
                                                href={`/user/${inventory.creator.id}`} 
                                                className="flex items-center gap-1 hover:underline"
                                            >
                                                {t('inventory.by', 'by')}
                                                <Avatar className="h-4 w-4">
                                                    <AvatarImage src={inventory.creator.avatarUrl} alt={inventory.creator.name} />
                                                    <AvatarFallback className="text-[8px]">
                                                        {inventory.creator.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{inventory.creator.name}</span>
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Likes and Views */}
                        <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`gap-1.5 ${isInventoryLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
                                onClick={handleToggleInventoryLike}
                            >
                                <Heart className={`h-4 w-4 ${isInventoryLiked ? 'fill-current' : ''}`} />
                                <span className="font-medium">{invLikeCount}</span>
                            </Button>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                <Eye className="h-4 w-4" />
                                <span>{inventoryViewCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {canAddItem && (
                            <ItemSheet 
                                inventoryId={inventory.id} 
                                fieldConfig={fieldsConfig}
                                idConfig={idConfig}
                            />
                        )}
                        {canEditInventory && (
                            <Button variant="outline" size="icon" onClick={() => setIsAccessModalOpen(true)} title={t('action.share', 'Share')}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        )}
                        {canEditInventory && (
                            <InventorySettingsSheet 
                                inventory={inventory} 
                                currentFieldsConfig={fieldsConfig}
                                currentIdConfig={idConfig}
                                onSettingsChange={(newFieldsConfig, newIdConfig) => {
                                    setFieldsConfig(newFieldsConfig);
                                    setIdConfig(newIdConfig);
                                }}
                            />
                        )}
                        {canEditInventory && (
                            <TrashToggle showDeleted={showDeleted} onToggle={toggleDeletedMode} />
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <Tabs defaultValue="items" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="items" className="gap-2">
                            {t('inventory.box', 'Box')} <Badge variant="secondary" className="ml-1 h-5 px-1.5">{items.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2">
                            <Activity className="h-4 w-4" /> {t('inventory.activity', 'Activity')}
                        </TabsTrigger>
                        <TabsTrigger value="discussion" className="gap-2">
                            <MessageSquare className="h-4 w-4" /> {t('inventory.comments', 'Discussion')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('inventory.search_items', 'Search items...')}
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>

                            
                            {/* Batch Actions Toolbar */}
                            {selectedIds.length > 0 && canAddItem && (
                                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border animate-in fade-in slide-in-from-right-4">
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {selectedIds.length} {t('inventory.selected', 'selected')}
                                    </span>
                                    <div className="h-4 w-px bg-border mx-1" />
                                    <Button variant="destructive" size="sm" className="h-7 px-2" onClick={handleBatchDelete}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        {t('action.delete', 'Delete')}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]">
                                            <Checkbox 
                                                checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead 
                                            className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                                            onClick={() => handleSort('customId')}
                                        >
                                            <div className="flex items-center gap-1">
                                                ID
                                                {sortBy === 'customId' ? (
                                                    sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                )}
                                            </div>
                                        </TableHead>
                                        {tableColumns.map(col => (
                                            <TableHead 
                                                key={col.key}
                                                className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSort(col.key)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    {sortBy === col.key ? (
                                                        sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map(item => (
                                            <TableRow key={item.id} data-state={selectedIds.includes(item.id) ? "selected" : undefined}>
                                                 <TableCell>
                                                    <Checkbox 
                                                        checked={selectedIds.includes(item.id)}
                                                        onCheckedChange={() => toggleSelectOne(item.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium font-mono">
                                                    <div className="flex items-center gap-2">
                                                        {item.customId}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className={`h-7 px-2 gap-1 ${likes[item.id] ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
                                                            onClick={(e) => { e.stopPropagation(); handleToggleLike(item.id); }}
                                                            title={likes[item.id] ? "Unlike" : "Like"}
                                                        >
                                                            <Heart className={`h-3.5 w-3.5 ${likes[item.id] ? 'fill-current' : ''}`} />
                                                            <span className="text-xs font-medium">
                                                                {localCounts[item.id] ?? 0}
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                {tableColumns.map(col => (
                                                    <TableCell key={col.key}>
                                                        {getItemValue(item, col.key) ?? '-'}
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {(showDeleted && canEditInventory) && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                                                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                                                        {t('action.restore', 'Restore')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive" onClick={() => handlePermanentDelete(item.id)}>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        {t('action.permanent_delete', 'Delete Forever')}
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {(!showDeleted && canAddItem) && (
                                                                <>
                                                                    <ItemSheet 
                                                                        inventoryId={inventory.id} 
                                                                        item={item}
                                                                        fieldConfig={fieldsConfig}
                                                                        idConfig={idConfig} 
                                                                        trigger={
                                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                        }
                                                                    />
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {!canAddItem && (
                                                                <DropdownMenuItem>
                                                                    <MoreHorizontal className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={tableColumns.length + 3} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 py-4">
                                                    <Package className="h-10 w-10 text-muted-foreground/30" />
                                                    <p className="text-muted-foreground">
                                                        {canAddItem 
                                                            ? t('inventory.no_items_can_add', 'Start by adding your first item to this inventory.')
                                                            : t('inventory.no_items_view_only', 'This inventory has no items yet.')
                                                        }
                                                    </p>
                                                    {canAddItem && (
                                                        <ItemSheet 
                                                            inventoryId={inventory.id} 
                                                            fieldConfig={fieldsConfig}
                                                            idConfig={idConfig}
                                                            trigger={
                                                                <Button size="sm">
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    {t('action.add_item', 'Add Item')}
                                                                </Button>
                                                            }
                                                        />
                                                    )}
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
                                <p className="text-muted-foreground text-center">Activity log coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="discussion">
                        <CommentsSection inventoryId={inventory.id} currentUser={currentUser} />
                    </TabsContent>
                </Tabs>
            </main>
            <ConfirmDialog />
            <AccessControlModal 
                inventoryId={inventory.id}
                initialSharedUsers={inventory.sharedWith || []}
                open={isAccessModalOpen}
                onOpenChange={setIsAccessModalOpen}
            />
        </div>
    );
}
