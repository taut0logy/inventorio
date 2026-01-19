import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Cloud } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function SalesforceSyncModal({ userId, isSynced, onSyncSuccess }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        company: '',
        phone: '',
        title: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/user/${userId}/salesforce/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(t('salesforce.success', 'Successfully synced with Salesforce!'));
                setOpen(false);
                if (onSyncSuccess) onSyncSuccess();
            } else {
                toast.error(data.error || t('salesforce.error.failed', 'Failed to sync with Salesforce'));
            }
        } catch (error) {
            console.error('Salesforce sync error:', error);
            toast.error(t('salesforce.error.unexpected', 'An unexpected error occurred'));
        } finally {
            setLoading(false);
        }
    };

    if (isSynced) {
        return (
            <Button variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-default">
                <Cloud className="w-4 h-4 mr-2" />
                {t('salesforce.synced', 'Synced with Salesforce')}
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                    <Cloud className="w-4 h-4 mr-2" />
                    {t('salesforce.sync_btn', 'Sync to Salesforce')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('salesforce.modal.title', 'Sync to Salesforce')}</DialogTitle>
                    <DialogDescription>
                        {t('salesforce.modal.desc', 'Create a Salesforce Account and Contact for your profile. We need a Company Name to create the Account.')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">{t('salesforce.field.company', 'Company / Organization')} <span className="text-red-500">*</span></Label>
                        <Input
                            id="company"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            placeholder={t('salesforce.placeholder.company', 'Acme Corp')}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('salesforce.field.title', 'Job Title')}</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t('salesforce.placeholder.title', 'Inventory Manager')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">{t('salesforce.field.phone', 'Phone Number')}</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('salesforce.modal.syncing', 'Syncing...')}
                                </>
                            ) : (
                                t('salesforce.modal.submit', 'Sync Profile')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
