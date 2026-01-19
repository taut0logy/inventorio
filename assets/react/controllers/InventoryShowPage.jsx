import React, { useState } from 'react';
import { toast } from 'sonner';
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
    Package,
    BarChart3,
    Download,
    FileSpreadsheet,
    FileText
} from 'lucide-react';
import { TrashToggle } from '@/components/common/TrashToggle';
import { LinkPreview } from '@/components/ui/link-preview';
import ReactMarkdown from 'react-markdown';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useMercure } from '@/hooks/use-mercure';
import { t } from '@/lib/i18n';
import ItemSheet from '@/components/inventory/ItemSheet';
import InventorySettingsSheet from '@/components/inventory/InventorySettingsSheet';
import CommentsSection from '@/components/inventory/CommentsSection';
import AccessControlModal from '@/components/inventory/AccessControlModal';
import ActivityTab from '@/components/inventory/ActivityTab';
import StatsTab from '@/components/inventory/StatsTab';
import RequestAccessButton from '@/components/inventory/RequestAccessButton';
import { useConfirm } from '@/components/common/useConfirm';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Get visible fields from inventory, sorted by position
const getVisibleFields = (fields) => {
    if (!fields || !Array.isArray(fields)) return [];
    return fields
        .filter(f => !f.hidden)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
};

export default function InventoryShowPage({
    inventory,
    currentUser,
    isCreator,
    isCollaborator = false,
    isAdmin = false,
    canAddItem = false,
    canEditItem = false,
    canEditInventory = false,
    canManageAccess = false,
    hasRequestedAccess = false,
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

    const [isInventoryLiked, setIsInventoryLiked] = useState(inventoryLiked);
    const [invLikeCount, setInvLikeCount] = useState(inventoryLikeCount);
    const [invViewCount, setInvViewCount] = useState(inventoryViewCount);

    // Real-time updates
    useMercure([`/inventory/${inventory.id}`], (data, type) => {
        if (type === 'stats') {
            setInvLikeCount(data.likes);
            setInvViewCount(data.views);
        } else if (type === 'item_stats') {
            const { itemId, data: stats } = data;
            setLocalCounts(prev => ({
                ...prev,
                [itemId]: stats.likes
            }));
        }
    });

    const handleToggleInventoryLike = async () => {
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }

        const wasLiked = isInventoryLiked;
        setIsInventoryLiked(!wasLiked);
        setInvLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/inventory/${inventory.id}/like`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setIsInventoryLiked(data.liked);
            setInvLikeCount(data.likeCount);
        } catch {
            setIsInventoryLiked(wasLiked);
            setInvLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
            toast.error(t('error.action_failed', 'Failed to update like'));
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
            const res = await fetch(`/api/items/${itemId}/like`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
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
            toast.error(t('error.action_failed', 'Failed to update like'));
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
            const res = await fetch(`/api/items/${id}/restore`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                toast.success(t('item.action.restored', 'Item restored'));
                window.location.reload();
            } else {
                const err = await res.json();
                toast.error(err.detail || err.error || err.title || t('error.action_failed', 'Failed to restore item'));
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
            const res = await fetch(`/api/items/${id}/permanent`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                toast.success(t('item.action.deleted_forever', 'Item permanently deleted'));
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

    // Fields from inventory (EAV)
    const [fields, setFields] = useState(() => inventory.fields || []);
    const [idConfig, setIdConfig] = useState(() => inventory.idGenerationConfig || {});

    // Visible fields ordered by position
    const visibleFields = getVisibleFields(fields);

    // Table columns from visible fields
    const tableColumns = visibleFields.map(f => ({
        key: f.id,
        label: f.label,
        type: f.type
    }));

    const getItemValue = (item, key) => {
        if (key === 'customId') return item.customId;
        // Look up in fieldValues by field ID
        return item.fieldValues?.[key] ?? null;
    };

    const [sortBy, setSortBy] = useState('customId');
    const [sortDir, setSortDir] = useState('asc');

    const saveSortOrder = async (newSortBy, newSortDir) => {
        // Sort order is now client-side only, no longer persisted
        toast.success(t('inventory.settings.sorted', 'Sorted'));
    };

    const handleSort = (key) => {
        let newSortBy = key;
        let newSortDir = 'asc';

        if (sortBy === key) {
            newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
        }

        setSortBy(newSortBy);
        setSortDir(newSortDir);

        saveSortOrder(newSortBy, newSortDir);
    };

    const filteredItems = items
        .filter(item => item.customId.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const valA = getItemValue(a, sortBy);
            const valB = getItemValue(b, sortBy);

            if (valA == null && valB == null) return 0;
            if (valA == null) return sortDir === 'asc' ? 1 : -1;
            if (valB == null) return sortDir === 'asc' ? -1 : 1;

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
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                toast.success(t('item.action.batch_deleted', 'Items deleted'));
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

    const handleDelete = async (id) => {
        if (!await confirm({
            title: t('confirm.delete', 'Delete Item?'),
            description: t('confirm.delete_desc', 'Are you sure you want to delete this item?'),
            confirmText: t('action.delete', 'Delete')
        })) return;

        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                toast.success(t('item.action.deleted', 'Item deleted'));
                window.location.reload();
            } else {
                const err = await response.json();
                toast.error(err.detail || err.error || err.title || t('error.action_failed', 'Failed to delete item'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(t('error.network', 'An error occurred'));
        }
    };

    const getExportData = () => {
        const headers = ['ID', ...tableColumns.map(col => col.label)];
        const rows = filteredItems.map(item => {
            const row = [item.customId];
            tableColumns.forEach(col => {
                const val = getItemValue(item, col.key);
                row.push(val ?? '');
            });
            return row;
        });
        return { headers, rows };
    };

    const handleExportCSV = () => {
        const { headers, rows } = getExportData();

        const escapeCSV = (val) => {
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${inventory.title}_items.csv`);
        toast.success(t('export.csv_success', 'Exported to CSV'));
    };

    const handleExportExcel = async () => {
        const { headers, rows } = getExportData();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Inventorio';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(inventory.title.substring(0, 31));

        worksheet.addRow(headers);
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

        rows.forEach(row => {
            worksheet.addRow(row);
        });

        worksheet.columns.forEach((column, index) => {
            let maxLength = headers[index]?.length || 10;
            rows.forEach(row => {
                const cellValue = String(row[index] ?? '');
                if (cellValue.length > maxLength) {
                    maxLength = cellValue.length;
                }
            });
            column.width = Math.min(maxLength + 2, 50);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${inventory.title}_items.xlsx`);
        toast.success(t('export.excel_success', 'Exported to Excel'));
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background pb-10 px-4 md:px-6 lg:px-8">
            {/* Sticky Header */}
            <header className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">

                <div className="container mx-auto px-4 py-3 min-h-16 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <a href="/inventory/">
                                <ArrowLeft className="h-5 w-5" />
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xl">📦</span>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg font-semibold leading-none mb-1 truncate max-w-[200px] sm:max-w-md">
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
                                    <span className="hidden xs:inline">•</span>
                                    <span className="hidden xs:inline">{items.length} {t('inventory.items', 'items')}</span>
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

                        {/* Likes and Views - Always visible, grouped to wrap together */}
                        <div className="flex items-center gap-3 pl-4 border-l border-border/50 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 gap-1.5 ${isInventoryLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
                                onClick={handleToggleInventoryLike}
                            >
                                <Heart className={`h-4 w-4 ${isInventoryLiked ? 'fill-current' : ''}`} />
                                <span className="font-medium">{invLikeCount}</span>
                            </Button>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                <Eye className="h-4 w-4" />
                                <span>{invViewCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canAddItem && (
                            <ItemSheet
                                inventoryId={inventory.id}
                                fields={fields}
                                idConfig={idConfig}
                            />
                        )}
                        {canManageAccess && (
                            <Button variant="outline" size="icon" onClick={() => setIsAccessModalOpen(true)} title={t('action.share', 'Share')}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        )}
                        {!isCollaborator && currentUser && (
                            <RequestAccessButton
                                inventoryId={inventory.id}
                                hasRequested={hasRequestedAccess}
                            />
                        )}
                        {canEditInventory && (
                            <InventorySettingsSheet
                                inventory={{ ...inventory, fields: fields }}
                                onSettingsChange={(newFields, newIdConfig) => {
                                    setFields(newFields);
                                    setIdConfig(newIdConfig);
                                }}
                            />
                        )}

                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-4">
                {inventory.description && (
                    <Accordion type="single" collapsible className="mb-6 w-full border rounded-lg bg-card shadow-sm">
                        <AccordionItem value="description" className="border-b-0 px-4">
                            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📝</span>
                                    {t('inventory.about', 'About this Inventory')}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-1">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                    <ReactMarkdown>{inventory.description}</ReactMarkdown>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                <Tabs defaultValue="items" className="">
                    <TabsList>
                        <TabsTrigger value="items" className="gap-2">
                            {t('inventory.box', 'Box')} <Badge variant="secondary" className="ml-1 h-5 px-1.5">{items.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> {t('inventory.stats', 'Stats')}
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2">
                            <Activity className="h-4 w-4" /> {t('inventory.activity', 'Activity')}
                        </TabsTrigger>
                        <TabsTrigger value="discussion" className="gap-2">
                            <MessageSquare className="h-4 w-4" /> {t('inventory.comments', 'Discussion')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="space-y-2">
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

                                {/* Export Dropdown */}
                                {items.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" title={t('export.title', 'Export')}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={handleExportCSV}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                {t('export.csv', 'Export as CSV')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleExportExcel}>
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                {t('export.excel', 'Export as Excel')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
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
                                                {tableColumns.map(col => {
                                                    const val = getItemValue(item, col.key);

                                                    // Link fields
                                                    if (col.type === 'link' && val) {
                                                        return (
                                                            <TableCell key={col.key}>
                                                                <LinkPreview url={val} className="font-medium text-primary hover:underline">
                                                                    View Link
                                                                </LinkPreview>
                                                            </TableCell>
                                                        );
                                                    }

                                                    // Boolean fields
                                                    if (col.type === 'boolean') {
                                                        return (
                                                            <TableCell key={col.key}>
                                                                {val === true || val === 'true' || val === 1 ? (
                                                                    <Badge variant="default" className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Yes</Badge>
                                                                ) : val === false || val === 'false' || val === 0 ? (
                                                                    <Badge variant="secondary" className="text-muted-foreground">No</Badge>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    }

                                                    // Number fields - format nicely
                                                    if (col.type === 'number' && val !== null && val !== undefined) {
                                                        return (
                                                            <TableCell key={col.key}>
                                                                {typeof val === 'number' ? val.toLocaleString() : val}
                                                            </TableCell>
                                                        );
                                                    }

                                                    // Default: string/text/select
                                                    return (
                                                        <TableCell key={col.key}>
                                                            {val ?? '-'}
                                                        </TableCell>
                                                    );
                                                })}
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
                                                                        fields={fields}
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
                                                            fields={fields}
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

                    <TabsContent value="stats">
                        <StatsTab inventoryId={inventory.id} />
                    </TabsContent>

                    <TabsContent value="activity">
                        <ActivityTab
                            inventoryId={inventory.id}
                            isCollaborator={isCollaborator}
                            canManageAccess={canManageAccess}
                        />
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
