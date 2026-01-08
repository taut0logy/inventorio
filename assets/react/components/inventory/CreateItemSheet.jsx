import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function CreateItemSheet({ inventoryId, trigger }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        customId: '',
        customString1: '',
        customNumber1: '',
        customText1: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/items/new/${inventoryId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create item');
            }

            // Success
            setOpen(false);
            setFormData({
                customId: '',
                customString1: '',
                customNumber1: '',
                customText1: '',
            });
            window.location.reload(); // Refresh to show new item
        } catch (error) {
            console.error('Error creating item:', error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>Add New Item</SheetTitle>
                        <SheetDescription>
                            Create a new item in this inventory.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customId">
                                Custom ID (Required) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customId"
                                name="customId"
                                value={formData.customId}
                                onChange={handleChange}
                                placeholder="e.g. A-001"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customString1">Custom String 1</Label>
                            <Input
                                id="customString1"
                                name="customString1"
                                value={formData.customString1}
                                onChange={handleChange}
                                placeholder="Text value..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customNumber1">Custom Number 1</Label>
                            <Input
                                id="customNumber1"
                                name="customNumber1"
                                type="number"
                                step="any"
                                value={formData.customNumber1}
                                onChange={handleChange}
                                placeholder="Numeric value..."
                            />
                        </div>

                         <div className="grid gap-2">
                            <Label htmlFor="customText1">Custom Text 1</Label>
                             <Textarea
                                id="customText1"
                                name="customText1"
                                value={formData.customText1}
                                onChange={handleChange}
                                placeholder="Longer description..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <SheetFooter>
                         <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t('action.cancel', 'Cancel')}
                            </Button>
                        </SheetClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Item
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
