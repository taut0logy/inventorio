import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
    ArrowUpDown
} from 'lucide-react';
import { t } from '@/lib/i18n';
import ItemSheet from '@/components/inventory/ItemSheet';
import InventorySettingsSheet from '@/components/inventory/InventorySettingsSheet';
import CommentsSection from '@/components/inventory/CommentsSection';

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
    items = []
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

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
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

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
        if (!window.confirm('Are you sure you want to delete this item?')) return;

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
        <div className="min-h-screen bg-background pb-10">
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
                                {/* We could use inventory.category.icon here */}
                                <span className="text-xl">📦</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold leading-none mb-1">
                                    {inventory.title}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 rounded-sm">
                                        {inventory.category.name}
                                    </Badge>
                                    {inventory.tags && inventory.tags.map(tag => (
                                        <Badge key={tag.id} variant="secondary" className="text-[10px] h-4 px-1 rounded-sm ml-1">
                                            #{tag.name}
                                        </Badge>
                                    ))}
                                    <span>•</span>
                                    <span>{items.length} items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isCreator && (
                            <ItemSheet 
                                inventoryId={inventory.id} 
                                fieldConfig={fieldsConfig}
                                idConfig={idConfig}
                            />
                        )}
                        {isCreator && (
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
                        {!isCreator && (
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
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
                            {selectedIds.length > 0 && isCreator && (
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
                                                <TableCell className="font-medium font-mono">{item.customId}</TableCell>
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
                                                            {isCreator && (
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
                                                            {!isCreator && (
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
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                {t('inventory.no_items_desc', 'Start by adding your first item to this inventory.')}
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
        </div>
    );
}
