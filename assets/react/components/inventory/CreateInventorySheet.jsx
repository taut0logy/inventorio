import React, { useState } from 'react';
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
import { Plus, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function CreateInventorySheet({ categories = [] }) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        isPublic: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await fetch('/inventory/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create inventory');
            }

            // Success
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating inventory:', error);
            // In a real app we'd show a toast here
            alert(error.message); 
            setIsLoading(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('home.hero.create', 'Create Inventory')}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-[540px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t('inventory.create_title', 'Create New Inventory')}</SheetTitle>
                    <SheetDescription>
                        {t('inventory.create_desc', 'Fill in the details below to create a new inventory space.')}
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
                            {t('inventory.form.submit', 'Create Inventory')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
