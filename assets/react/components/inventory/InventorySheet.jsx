import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger,
    SheetFooter,
    SheetClose 
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Pencil, Check, AlertCircle, Cloud } from 'lucide-react';
import { t } from '@/lib/i18n';
import TagInput from '@/components/inventory/TagInput';

export default function InventorySheet({ 
    categories = [], 
    inventory = null, 
    trigger = null, 
    open, 
    onOpenChange 
}) {
    const isEdit = !!inventory;
    const [isLoading, setIsLoading] = useState(false);
    
    // Auto-save states
    const [version, setVersion] = useState(inventory?.version || 1);
    const [isDirty, setIsDirty] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [conflictError, setConflictError] = useState(null);
    const autoSaveTimerRef = useRef(null);
    const initialFormDataRef = useRef(null);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        isPublic: false,
        tags: []
    });

    // Initialize form data when inventory changes or sheet opens
    useEffect(() => {
        if (inventory) {
            const initial = {
                title: inventory.title || '',
                category: typeof inventory.categoryId === 'string' ? inventory.categoryId : 
                          categories.find(c => c.name === inventory.category)?.id || '', 
                description: inventory.description || '',
                isPublic: inventory.isPublic || false,
                tags: inventory.tags ? inventory.tags.map(t => t.name || t) : []
            };
            setFormData(initial);
            initialFormDataRef.current = JSON.stringify(initial);
            setVersion(inventory.version || 1);
            setIsDirty(false);
            setAutoSaveStatus('idle');
            setConflictError(null);
        } else {
            setFormData({
                title: '',
                category: '',
                description: '',
                isPublic: false,
                tags: []
            });
            initialFormDataRef.current = null;
            setIsDirty(false);
        }
    }, [inventory, categories, open]);

    // Track dirty state
    const updateFormData = useCallback((updates) => {
        setFormData(prev => {
            const newData = { ...prev, ...updates };
            // Check if data has changed from initial
            if (isEdit && initialFormDataRef.current) {
                const hasChanges = JSON.stringify(newData) !== initialFormDataRef.current;
                setIsDirty(hasChanges);
                if (hasChanges) {
                    setAutoSaveStatus('idle');
                }
            }
            return newData;
        });
    }, [isEdit]);

    // Auto-save timer (7 seconds after changes)
    useEffect(() => {
        if (!isEdit || !isDirty || autoSaveStatus === 'saving') return;

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer
        autoSaveTimerRef.current = setTimeout(() => {
            performAutoSave();
        }, 7000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [formData, isDirty, isEdit]);

    const performAutoSave = async () => {
        if (!isEdit || !inventory?.id || !isDirty) return;

        setAutoSaveStatus('saving');
        try {
            const response = await fetch(`/inventory/${inventory.id}/auto-save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    expectedVersion: version
                })
            });

            if (response.ok) {
                const data = await response.json();
                setVersion(data.version);
                setIsDirty(false);
                setAutoSaveStatus('saved');
                setConflictError(null);
                initialFormDataRef.current = JSON.stringify(formData);
                
                // Reset status after 3 seconds
                setTimeout(() => {
                    setAutoSaveStatus('idle');
                }, 3000);
            } else if (response.status === 409) {
                setAutoSaveStatus('error');
                setConflictError(t('error.conflict', 'This inventory has been modified by another user. Please refresh.'));
            } else {
                setAutoSaveStatus('error');
            }
        } catch (error) {
            console.error('Auto-save error:', error);
            setAutoSaveStatus('error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const url = isEdit ? `/inventory/${inventory.id}/edit` : '/inventory/new';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.status === 409) {
                alert(t('error.conflict', 'Conflict detected: This inventory has been modified by another user. The page will reload.'));
                window.location.reload();
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save inventory');
            }

            // Success
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error saving inventory:', error);
            alert(error.message); 
            setIsLoading(false);
        }
    };

    const renderAutoSaveStatus = () => {
        if (!isEdit) return null;
        
        return (
            <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">{t('autosave.saving', 'Saving...')}</span>
                    </>
                )}
                {autoSaveStatus === 'saved' && (
                    <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{t('autosave.saved', 'Saved')}</span>
                    </>
                )}
                {autoSaveStatus === 'error' && (
                    <>
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">{t('autosave.error', 'Save failed')}</span>
                    </>
                )}
                {autoSaveStatus === 'idle' && isDirty && (
                    <>
                        <Cloud className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('autosave.unsaved', 'Unsaved changes')}</span>
                    </>
                )}
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* If managed externally (open prop), we might not need trigger. But if provided... */}
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            
            {/* Default Trigger for Create Mode if no trigger provided & controlled externally */}
            {!trigger && !isEdit && !onOpenChange && (
                <SheetTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('home.hero.create', 'Create Inventory')}
                    </Button>
                </SheetTrigger>
            )}

            <SheetContent side="right" className="w-full max-w-none sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {isEdit 
                            ? t('inventory.edit_title', 'Edit Inventory') 
                            : t('inventory.create_title', 'Create New Inventory')
                        }
                    </SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? t('inventory.edit_desc', 'Update your inventory details.')
                            : t('inventory.create_desc', 'Fill in the details below to create a new inventory space.')
                        }
                    </SheetDescription>
                    {renderAutoSaveStatus()}
                </SheetHeader>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 px-4 md:px-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            {t('inventory.form.title', 'Title')} <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                            id="title" 
                            required 
                            placeholder="e.g. My Rare Coins"
                            value={formData.title}
                            onChange={(e) => updateFormData({ title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">
                            {t('inventory.form.category', 'Category')} <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                            required
                            value={formData.category} 
                            onValueChange={(val) => updateFormData({ category: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        <span className="flex items-center gap-2">
                                            <span>{cat.icon || '📁'}</span>
                                            <span>{cat.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">
                            Description (Markdown supported)
                        </Label>
                        <Textarea 
                            id="description" 
                            className="min-h-[120px]"
                            placeholder="Describe your inventory..."
                            value={formData.description}
                            onChange={(e) => updateFormData({ description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Tags</Label>
                        <TagInput 
                            value={formData.tags}
                            onChange={(tags) => updateFormData({ tags })}
                            placeholder="Add tags (e.g. rare, vintage)"
                        />
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg md:col-span-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="isPublic" className="text-base">
                                {t('inventory.form.public', 'Public Inventory')}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Anyone can view this inventory if enabled.
                            </p>
                        </div>
                        <Switch 
                            id="isPublic"
                            checked={formData.isPublic}
                            onCheckedChange={(checked) => updateFormData({ isPublic: checked })}
                        />
                    </div>

                    <SheetFooter className="gap-2 md:col-span-2">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t('inventory.form.cancel', 'Cancel')}
                            </Button>
                        </SheetClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? t('action.save', 'Save Changes') : t('inventory.form.submit', 'Create Inventory')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
