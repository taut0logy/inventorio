import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import { Settings, Loader2, Hash, List, Key, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import CustomIdBuilder from './CustomIdBuilder';
import CustomFieldsEditor from './CustomFieldsEditor';

export default function InventorySettingsSheet({
    inventory,
    trigger,
    onSettingsChange
}) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('id');

    // API Token state
    const [apiTokenInfo, setApiTokenInfo] = useState(null);
    const [generatedToken, setGeneratedToken] = useState(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

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

    // Initialize with proper values from props/inventory
    const getInitialIdConfig = () => parseIdConfig(inventory.idGenerationConfig);

    // Fields are now an array directly from inventory
    const getInitialFields = () => {
        if (inventory.fields && Array.isArray(inventory.fields)) {
            return [...inventory.fields];
        }
        return [];
    };

    // Working copies of config (initialized with actual values)
    const [idConfig, setIdConfig] = useState(getInitialIdConfig);
    const [fields, setFields] = useState(getInitialFields);

    // Sync state when sheet opens (in case parent state changed)
    useEffect(() => {
        if (open) {
            setIdConfig(getInitialIdConfig());
            setFields(getInitialFields());
            fetchApiTokenInfo();
        }
    }, [open, inventory]);

    const fetchApiTokenInfo = async () => {
        try {
            const res = await fetch(`/inventory/${inventory.id}/api-token`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setApiTokenInfo(data);
            }
        } catch (err) {
            console.error('Failed to fetch API token info:', err);
        }
    };

    const handleGenerateToken = async () => {
        setIsGeneratingToken(true);
        try {
            const res = await fetch(`/inventory/${inventory.id}/api-token/generate`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate token');

            setGeneratedToken(data.apiToken);
            setApiTokenInfo({ hasToken: true, createdAt: data.createdAt, tokenPreview: data.apiToken.substring(0, 8) + '...' });
            toast.success(t('api.token_generated', 'API token generated successfully'));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const handleRevokeToken = async () => {
        if (!confirm(t('api.confirm_revoke', 'Are you sure you want to revoke the API token? External integrations will stop working.'))) return;

        try {
            const res = await fetch(`/inventory/${inventory.id}/api-token/revoke`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to revoke token');

            setApiTokenInfo({ hasToken: false });
            setGeneratedToken(null);
            toast.success(t('api.token_revoked', 'API token revoked'));
        } catch (err) {
            toast.error(err.message);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success(t('common.copied', 'Copied to clipboard'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/inventory/${inventory.id}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    fields: fields,
                    idGenerationConfig: idConfig,
                    version: inventory?.version
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || result.error || result.title || 'Failed to save settings');
            }

            // Call the callback to update parent state instantly
            if (onSettingsChange) {
                onSettingsChange(result.fields || fields, idConfig);
            }

            toast.success(t('settings.saved', 'Settings saved successfully'));
            setOpen(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.message || t('error.save_failed', 'Failed to save settings'));
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
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="id" className="gap-2">
                                <Hash className="h-4 w-4" />
                                {t('settings.tab_id', 'Custom ID')}
                            </TabsTrigger>
                            <TabsTrigger value="fields" className="gap-2">
                                <List className="h-4 w-4" />
                                {t('settings.tab_fields', 'Custom Fields')}
                            </TabsTrigger>
                            <TabsTrigger value="api" className="gap-2">
                                <Key className="h-4 w-4" />
                                {t('settings.tab_api', 'API')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="id" className="mt-4 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                {t('settings.id_desc', 'Build your custom ID format using drag-and-drop elements. IDs are generated automatically when items are created.')}
                            </div>
                            <CustomIdBuilder
                                value={idConfig}
                                onChange={setIdConfig}
                            />
                        </TabsContent>

                        <TabsContent value="fields" className="mt-4 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                {t('settings.fields_desc', 'Add unlimited custom fields to your inventory. Drag to reorder, click the eye to toggle visibility.')}
                            </div>
                            <CustomFieldsEditor
                                fields={fields}
                                onChange={setFields}
                            />
                        </TabsContent>

                        <TabsContent value="api" className="mt-4 space-y-6">
                            <div className="text-sm text-muted-foreground mb-4">
                                {t('settings.api_desc', 'Generate an API token to allow external applications (like Odoo) to access this inventory\'s aggregated data.')}
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">{t('api.token_status', 'API Token Status')}</Label>
                                    {apiTokenInfo?.hasToken ? (
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">●  {t('api.active', 'Active')}</span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">{t('api.not_generated', 'Not Generated')}</span>
                                    )}
                                </div>

                                {apiTokenInfo?.hasToken && !generatedToken && (
                                    <div className="text-sm text-muted-foreground">
                                        {t('api.token_preview', 'Token')}: <code className="bg-muted px-1 rounded">{apiTokenInfo.tokenPreview}</code>
                                        <span className="ml-2">({t('api.created', 'Created')}: {apiTokenInfo.createdAt})</span>
                                    </div>
                                )}

                                {generatedToken && (
                                    <div className="space-y-2">
                                        <Label>{t('api.your_token', 'Your API Token')}:</Label>
                                        <div className="flex gap-2">
                                            <Input value={generatedToken} readOnly className="font-mono text-xs" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(generatedToken)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            ⚠️ {t('api.token_warning', 'Copy this token now. It will only be shown once.')}
                                        </p>
                                        <div className="mt-2">
                                            <Label>{t('api.endpoint_url', 'API Endpoint')}:</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input value={`${window.location.origin}/api/external/inventory/${generatedToken}`} readOnly className="font-mono text-xs" />
                                                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(`${window.location.origin}/api/external/inventory/${generatedToken}`)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    {!apiTokenInfo?.hasToken ? (
                                        <Button type="button" onClick={handleGenerateToken} disabled={isGeneratingToken}>
                                            {isGeneratingToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                                            {t('api.generate', 'Generate Token')}
                                        </Button>
                                    ) : (
                                        <>
                                            <Button type="button" variant="outline" onClick={handleGenerateToken} disabled={isGeneratingToken}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                {t('api.regenerate', 'Regenerate')}
                                            </Button>
                                            <Button type="button" variant="destructive" onClick={handleRevokeToken}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('api.revoke', 'Revoke Token')}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
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

