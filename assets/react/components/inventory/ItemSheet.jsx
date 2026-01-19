import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Pencil, HelpCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function ItemSheet({ inventoryId, item, trigger, fields = [], idConfig = {} }) {
    const isEditMode = !!item;
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form data: customId + fieldValues keyed by field ID
    const [formData, setFormData] = useState({ customId: '', fieldValues: {} });

    // Detect if auto-ID is configured
    const hasElements = idConfig?.elements && Array.isArray(idConfig.elements) && idConfig.elements.length > 0;
    const isOldAutoFormat = idConfig?.type === 'auto' && !hasElements;
    const isAutoId = hasElements || isOldAutoFormat;

    // Get visible fields ordered by position
    const visibleFields = fields
        .filter(f => !f.hidden)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

    // Reset or populate form on open/change
    useEffect(() => {
        if (open) {
            const newFormData = {
                customId: '',
                fieldValues: {}
            };

            // Initialize all fields with empty values
            fields.forEach(f => {
                newFormData.fieldValues[f.id] = '';
            });

            if (isEditMode && item) {
                newFormData.customId = item.customId || '';
                // Populate field values from item
                if (item.fieldValues) {
                    Object.keys(item.fieldValues).forEach(fieldId => {
                        newFormData.fieldValues[fieldId] = item.fieldValues[fieldId] ?? '';
                    });
                }
                newFormData.tags = item.tags ? item.tags.map(t => typeof t === 'string' ? t : t.name) : [];
            } else {
                newFormData.tags = [];
            }

            setFormData(newFormData);
        }
    }, [open, isEditMode, item, fields]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFieldChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            fieldValues: {
                ...prev.fieldValues,
                [fieldId]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validation
        const errors = [];
        visibleFields.forEach(field => {
            const value = formData.fieldValues[field.id];
            const label = field.label;

            // Required check
            if (field.required && (value === '' || value === null || value === undefined)) {
                errors.push(t('val.field_required', { label }, `${label} is required.`));
            }

            // Skip further validation if empty
            if (value === '' || value === null || value === undefined) {
                return;
            }

            // Regex check
            if (field.regex && ['string', 'text', 'link', 'select'].includes(field.type)) {
                try {
                    const regex = new RegExp(field.regex);
                    if (!regex.test(value)) {
                        errors.push(t('val.field_regex', { label }, `${label} format is invalid.`));
                    }
                } catch (e) {
                    console.error("Invalid Regex:", field.regex);
                }
            }

            // Min/Max check (Numbers)
            if (field.type === 'number' && value !== '') {
                const numVal = parseFloat(value);
                if (field.min !== undefined && field.min !== null && numVal < field.min) {
                    errors.push(t('val.field_min', { label, min: field.min }, `${label} must be at least ${field.min}.`));
                }
                if (field.max !== undefined && field.max !== null && numVal > field.max) {
                    errors.push(t('val.field_max', { label, max: field.max }, `${label} must be at most ${field.max}.`));
                }
            }
        });

        if (errors.length > 0) {
            errors.forEach(err => toast.error(err));
            setIsLoading(false);
            return;
        }

        try {
            const url = isEditMode
                ? `/api/items/${item.id}`
                : `/api/items/new/${inventoryId}`;

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    customId: formData.customId,
                    fieldValues: formData.fieldValues,
                    tags: formData.tags,
                    version: item?.version
                })
            });

            const data = await response.json();

            if (response.status === 409) {
                const msg = data.detail || data.error || t('error.conflict', 'Conflict detected: Item modified by another user.');
                toast.error(msg);
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            if (!response.ok) {
                throw new Error(data.detail || data.error || data.title || `Failed to save item (${response.status})`);
            }

            // Success
            setOpen(false);
            toast.success(isEditMode ? t('item.action.updated', 'Item updated') : t('item.action.created', 'Item created'));
            window.location.reload();
        } catch (error) {
            console.error('Error saving item:', error);
            toast.error(error.message || t('error.save_failed', 'Failed to save item'));
        } finally {
            setIsLoading(false);
        }
    };

    // Render a field based on its type
    const renderField = (field) => {
        const value = formData.fieldValues[field.id] ?? '';

        const labelElement = (
            <div className="flex items-center gap-1">
                <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-[200px] text-xs">{field.description}</p>
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
                    <div key={field.id} className="grid gap-2">
                        {labelElement}
                        <Input
                            id={field.id}
                            type={field.type === 'link' ? 'url' : 'text'}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.type === 'link' ? 'https://...' : t('item.enter_text', 'Enter text...')}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div key={field.id} className="grid gap-2">
                        {labelElement}
                        <Input
                            id={field.id}
                            type="number"
                            step="any"
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={t('item.enter_number', 'Enter number...')}
                            min={field.min}
                            max={field.max}
                        />
                    </div>
                );

            case 'text':
                // Text areas span full width
                return (
                    <div key={field.id} className="grid gap-2 md:col-span-2">
                        {labelElement}
                        <Textarea
                            id={field.id}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={t('item.enter_multiline', 'Enter multi-line text...')}
                            className="min-h-[80px]"
                        />
                    </div>
                );

            case 'boolean':
                return (
                    <div key={field.id} className="flex items-center gap-3 py-2">
                        <Checkbox
                            id={field.id}
                            checked={!!value}
                            onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                        />
                        {labelElement}
                    </div>
                );

            case 'select':
                const options = field.options || [];

                return (
                    <div key={field.id} className="grid gap-2">
                        {labelElement}
                        <Select
                            value={value || ''}
                            onValueChange={(val) => handleFieldChange(field.id, val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('item.select_option', 'Select an option...')} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt, i) => (
                                    <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                {t('action.add_item', 'Add Item')}
                            </>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full max-w-none sm:max-w-2xl overflow-y-auto px-4 md:px-6">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>{isEditMode ? t('item.edit_title', 'Edit Item') : t('item.create_title', 'Add New Item')}</SheetTitle>
                        <SheetDescription>
                            {isEditMode ? t('item.edit_desc', 'Update item information.') : t('item.create_desc', 'Enter item details below.')}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Custom ID Field - Full width */}
                        <div className="grid gap-2 md:col-span-2">
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
                        {visibleFields.map(renderField)}
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
