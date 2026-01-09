import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Loader2, Pencil, HelpCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import TagInput from '@/components/inventory/TagInput';

// All field definitions
const ALL_FIELDS = [
    { key: 'string1', formKey: 'customString1', type: 'string', defaultLabel: 'Custom String 1' },
    { key: 'string2', formKey: 'customString2', type: 'string', defaultLabel: 'Custom String 2' },
    { key: 'string3', formKey: 'customString3', type: 'string', defaultLabel: 'Custom String 3' },
    { key: 'number1', formKey: 'customNumber1', type: 'number', defaultLabel: 'Custom Number 1' },
    { key: 'number2', formKey: 'customNumber2', type: 'number', defaultLabel: 'Custom Number 2' },
    { key: 'number3', formKey: 'customNumber3', type: 'number', defaultLabel: 'Custom Number 3' },
    { key: 'text1', formKey: 'customText1', type: 'text', defaultLabel: 'Custom Text 1' },
    { key: 'text2', formKey: 'customText2', type: 'text', defaultLabel: 'Custom Text 2' },
    { key: 'text3', formKey: 'customText3', type: 'text', defaultLabel: 'Custom Text 3' },
    { key: 'link1', formKey: 'customLink1', type: 'link', defaultLabel: 'Custom Link 1' },
    { key: 'link2', formKey: 'customLink2', type: 'link', defaultLabel: 'Custom Link 2' },
    { key: 'link3', formKey: 'customLink3', type: 'link', defaultLabel: 'Custom Link 3' },
    { key: 'bool1', formKey: 'customBool1', type: 'boolean', defaultLabel: 'Custom Boolean 1' },
    { key: 'bool2', formKey: 'customBool2', type: 'boolean', defaultLabel: 'Custom Boolean 2' },
    { key: 'bool3', formKey: 'customBool3', type: 'boolean', defaultLabel: 'Custom Boolean 3' },
];

export default function ItemSheet({ inventoryId, item, trigger, fieldConfig = {}, idConfig = {} }) {
    const isEditMode = !!item;
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Initialize form data with all fields
    const [formData, setFormData] = useState({});

    // Detect if auto-ID is configured (new elements format or old auto type)
    const hasElements = idConfig?.elements && Array.isArray(idConfig.elements) && idConfig.elements.length > 0;
    const isOldAutoFormat = idConfig?.type === 'auto' && !hasElements;
    const isAutoId = hasElements || isOldAutoFormat;
    
    // Get field order from config, or use default order
    const fieldOrder = fieldConfig?.order || ALL_FIELDS.map(f => f.key);
    const fields = fieldConfig?.fields || {};
    
    // Helper to get label
    const getLabel = (key, defaultLabel) => {
        const config = fields[key];
        if (config?.label) {
            return config.label;
        }
        return defaultLabel;
    };

    // Helper to get description for tooltip
    const getDescription = (key) => {
        const config = fields[key];
        return config?.description || null;
    };

    // Helper to check visibility
    const isVisible = (key) => {
        const config = fields[key];
        if (config?.hidden === true) {
            return false;
        }
        return true;
    };

    // Get ordered and visible fields
    const orderedFields = fieldOrder
        .map(key => ALL_FIELDS.find(f => f.key === key))
        .filter(Boolean)
        .filter(field => isVisible(field.key));

    // Reset or populate form on open/change
    useEffect(() => {
        if (open) {
            const newFormData = { customId: '' };
            ALL_FIELDS.forEach(f => {
                newFormData[f.formKey] = '';
            });
            
            if (isEditMode && item) {
                newFormData.customId = item.customId || '';
                ALL_FIELDS.forEach(f => {
                    newFormData[f.formKey] = item[f.formKey + 'Value'] ?? '';
                });
                newFormData.tags = item.tags ? item.tags.map(t => typeof t === 'string' ? t : t.name) : [];
            } else {
                newFormData.tags = [];
            }
            
            setFormData(newFormData);
        }
    }, [open, isEditMode, item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBoolChange = (key, checked) => {
        setFormData(prev => ({
            ...prev,
            [key]: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isEditMode 
                ? `/api/items/${item.id}` 
                : `/api/items/new/${inventoryId}`;
            
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.status === 409) {
                alert(t('error.conflict', 'Conflict detected: This item has been modified by another user. The page will reload.'));
                window.location.reload();
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save item');
            }

            // Success
            setOpen(false);
            window.location.reload(); 
        } catch (error) {
            console.error('Error saving item:', error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Render a field based on its type
    const renderField = (field) => {
        const label = getLabel(field.key, field.defaultLabel);
        const description = getDescription(field.key);
        const value = formData[field.formKey];

        const labelElement = (
            <div className="flex items-center gap-1">
                <Label htmlFor={field.formKey}>{label}</Label>
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-[200px] text-xs">{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );

        switch (field.type) {
            case 'string':
            case 'link':
                return (
                    <div key={field.key} className="grid gap-2">
                        {labelElement}
                        <Input
                            id={field.formKey}
                            name={field.formKey}
                            type={field.type === 'link' ? 'url' : 'text'}
                            value={value || ''}
                            onChange={handleChange}
                            placeholder={field.type === 'link' ? 'https://...' : 'Enter text...'}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div key={field.key} className="grid gap-2">
                        {labelElement}
                        <Input
                            id={field.formKey}
                            name={field.formKey}
                            type="number"
                            step="any"
                            value={value || ''}
                            onChange={handleChange}
                            placeholder="Enter number..."
                        />
                    </div>
                );

            case 'text':
                return (
                    <div key={field.key} className="grid gap-2">
                        {labelElement}
                        <Textarea
                            id={field.formKey}
                            name={field.formKey}
                            value={value || ''}
                            onChange={handleChange}
                            placeholder="Enter multi-line text..."
                            className="min-h-[80px]"
                        />
                    </div>
                );

            case 'boolean':
                return (
                    <div key={field.key} className="flex items-center gap-3 py-2">
                        <Checkbox
                            id={field.formKey}
                            checked={!!value}
                            onCheckedChange={(checked) => handleBoolChange(field.formKey, checked)}
                        />
                        {labelElement}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant={isEditMode ? "ghost" : "default"} size={isEditMode ? "sm" : "default"}>
                        {isEditMode ? (
                            <>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                {t('action.edit', 'Edit')}
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('inventory.add_item', 'Add Item')}
                            </>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto px-4">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>{isEditMode ? t('item.edit_title', 'Edit Item') : t('item.create_title', 'Add New Item')}</SheetTitle>
                        <SheetDescription>
                            {isEditMode ? t('item.edit_desc', 'Update item information.') : t('item.create_desc', 'Enter item details below.')}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        {/* Custom ID Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="customId">
                                {t('item.id_label', 'Item ID')} {isAutoId && !isEditMode ? `(${t('item.id_auto', 'Auto-generated on save')})` : ''} 
                                {!isAutoId && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            <Input
                                id="customId"
                                name="customId"
                                value={isAutoId && !isEditMode ? `(${t('item.id_auto', 'Auto-generated on save')})` : formData.customId || ''}
                                onChange={handleChange}
                                placeholder="e.g. A-001"
                                required={!isAutoId}
                                disabled={isAutoId && !isEditMode} 
                                className={isAutoId && !isEditMode ? "bg-muted text-muted-foreground" : ""}
                            />
                        </div>

                        {/* Render all visible fields in order */}
                        {orderedFields.map(renderField)}
                    </div>
                    <SheetFooter>
                         <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t('action.cancel', 'Cancel')}
                            </Button>
                        </SheetClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? (isEditMode ? t('item.saving', 'Saving...') : t('item.creating', 'Creating...')) : 
                                (isEditMode ? t('item.update_btn', 'Save Changes') : t('item.create_btn', 'Create Item'))}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
