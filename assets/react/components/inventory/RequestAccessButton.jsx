import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserPlus, Clock, Loader2, Check } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function RequestAccessButton({ inventoryId, hasRequested: initialHasRequested }) {
    const [hasRequested, setHasRequested] = useState(initialHasRequested);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/inventory/${inventoryId}/request-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() || null })
            });

            if (res.ok) {
                setHasRequested(true);
                setSuccess(true);
                setTimeout(() => {
                    setDialogOpen(false);
                    setSuccess(false);
                }, 1500);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send request');
            }
        } catch (err) {
            console.error('Error requesting access:', err);
            alert('An error occurred');
        }
        setLoading(false);
    };

    if (hasRequested) {
        return (
            <Button variant="outline" disabled className="gap-2">
                <Clock className="h-4 w-4" />
                {t('access.requested', 'Access Requested')}
            </Button>
        );
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('access.request', 'Request Edit Access')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-lg font-medium">{t('access.request_sent', 'Request Sent!')}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('access.request_sent_desc', 'The owner will review your request.')}
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t('access.request_title', 'Request Edit Access')}</DialogTitle>
                            <DialogDescription>
                                {t('access.request_desc', 'Send a request to the inventory owner for edit access. You can include an optional message.')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="message">{t('access.message', 'Message (optional)')}</Label>
                                <Textarea
                                    id="message"
                                    placeholder={t('access.message_placeholder', "I'd like to contribute to this inventory...")}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={200}
                                    className="min-h-[80px]"
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {message.length}/200
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setDialogOpen(false)}
                                disabled={loading}
                            >
                                {t('action.cancel', 'Cancel')}
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t('access.send_request', 'Send Request')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
