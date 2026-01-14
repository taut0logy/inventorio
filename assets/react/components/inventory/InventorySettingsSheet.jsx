import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Settings, Loader2, Hash, List, Sliders } from 'lucide-react';
import { t } from '@/lib/i18n';
import CustomIdBuilder from './CustomIdBuilder';
import CustomFieldsEditor from './CustomFieldsEditor';

export default function InventorySettingsSheet({ 
    inventory, 
    trigger, 
    currentFieldsConfig,
    currentIdConfig,
    onSettingsChange 
}) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('id');

    // Default configurations
    const DEFAULT_ID_CONFIG = { elements: [{ type: 'sequence', minDigits: 4 }] };
    
    // Helper to parse ID config (handles empty/old formats)
    const parseIdConfig = (cfg) => {
        if (!cfg || Object.keys(cfg).length === 0) {
            return DEFAULT_ID_CONFIG;
        }
        // Has valid elements array
        if (cfg.elements && Array.isArray(cfg.elements) && cfg.elements.length > 0) {
            return cfg;
        }
        // Migrate old format
        if (cfg.type || cfg.prefix) {
            const elements = [];
            if (cfg.prefix) elements.push({ type: 'fixed', value: cfg.prefix });
            if (cfg.separator) elements.push({ type: 'fixed', value: cfg.separator });
            if (cfg.type === 'auto') {
                elements.push({ type: 'sequence', minDigits: cfg.minDigits || 4 });
            }
            return elements.length > 0 ? { elements } : DEFAULT_ID_CONFIG;
        }
        return DEFAULT_ID_CONFIG;
    };

    // Helper to parse fields config
    const parseFieldsConfig = (cfg) => {
        if (!cfg || Object.keys(cfg).length === 0) {
            return { order: [], fields: {} };
        }
        if (cfg.order && cfg.fields) {
            return cfg;
        }
        if (!cfg.order && Object.keys(cfg).length > 0) {
            return { order: Object.keys(cfg), fields: cfg };
        }
        return { order: [], fields: {} };
    };

    // Initialize with proper values from props/inventory
    const getInitialIdConfig = () => parseIdConfig(currentIdConfig || inventory.idGenerationConfig);
    const getInitialFieldsConfig = () => parseFieldsConfig(currentFieldsConfig || inventory.customFieldsConfig);

    // Working copies of config (initialized with actual values)
    const [idConfig, setIdConfig] = useState(getInitialIdConfig);
    const [fieldsConfig, setFieldsConfig] = useState(getInitialFieldsConfig);

    // Sync state when sheet opens (in case parent state changed)
    useEffect(() => {
        if (open) {
            setIdConfig(getInitialIdConfig());
            setFieldsConfig(getInitialFieldsConfig());
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/inventory/${inventory.id}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customFieldsConfig: fieldsConfig,
                    idGenerationConfig: idConfig
                })
            });

            if (!response.ok) throw new Error('Failed to save settings');

            // Call the callback to update parent state instantly
            if (onSettingsChange) {
                onSettingsChange(fieldsConfig, idConfig);
            }
            
            setOpen(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full max-w-none sm:max-w-3xl overflow-y-auto px-4 md:px-10">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>{t('settings.title', 'Inventory Settings')}</SheetTitle>
                        <SheetDescription>
                            {t('settings.desc', 'Configure how your inventory works.')}
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="id" className="gap-2">
                                <Hash className="h-4 w-4" />
                                {t('settings.tab_id', 'Custom ID')}
                            </TabsTrigger>
                            <TabsTrigger value="fields" className="gap-2">
                                <List className="h-4 w-4" />
                                {t('settings.tab_fields', 'Custom Fields')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="id" className="mt-4 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                Build your custom ID format using drag-and-drop elements.
                                IDs are generated automatically when items are created.
                            </div>
                            <CustomIdBuilder
                                value={idConfig}
                                onChange={setIdConfig}
                            />
                        </TabsContent>

                        <TabsContent value="fields" className="mt-4 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                Customize field labels, add descriptions, and reorder fields.
                                Only visible fields will appear in forms and tables.
                            </div>
                            <CustomFieldsEditor
                                value={fieldsConfig}
                                onChange={setFieldsConfig}
                            />
                        </TabsContent>
                    </Tabs>

                    <SheetFooter className="mt-6">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t('action.cancel', 'Cancel')}
                            </Button>
                        </SheetClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t('settings.saving', 'Saving...') : t('settings.save', 'Save Settings')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
