import React, { useState, useEffect } from 'react';
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
import { Plus, Loader2, Pencil } from 'lucide-react';
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
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        isPublic: false,
        tags: []
    });

    useEffect(() => {
        if (inventory) {
            setFormData({
                title: inventory.title || '',
                // If inventory.category is just a string name, we might need to find ID. 
                // But usually we need ID. Assuming parent passes generic object.
                // If inventory.category is object/string, we need to map to ID.
                category: typeof inventory.categoryId === 'string' ? inventory.categoryId : 
                          categories.find(c => c.name === inventory.category)?.id || '', 
                description: inventory.description || '',
                isPublic: inventory.isPublic || false,
                tags: inventory.tags ? inventory.tags.map(t => t.name || t) : []
            });
        } else {
            setFormData({
                title: '',
                category: '',
                description: '',
                isPublic: false,
                tags: []
            });
        }
    }, [inventory, categories, open]);

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

            <SheetContent side="right" className="sm:max-w-[540px] w-full overflow-y-auto">
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
                </SheetHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            {t('inventory.form.title', 'Title')} <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                            id="title" 
                            required 
                            placeholder="e.g. My Rare Coins"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">
                            {t('inventory.form.category', 'Category')} <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                            required
                            value={formData.category} 
                            onValueChange={(val) => setFormData({...formData, category: val})}
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

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (Markdown supported)
                        </Label>
                        <Textarea 
                            id="description" 
                            className="min-h-[120px]"
                            placeholder="Describe your inventory..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <TagInput 
                            value={formData.tags}
                            onChange={(tags) => setFormData({...formData, tags})}
                            placeholder="Add tags (e.g. rare, vintage)"
                        />
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
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
                            onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                        />
                    </div>

                    <SheetFooter className="mt-8 gap-2">
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
