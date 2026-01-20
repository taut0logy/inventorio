import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { HelpCircle, Send, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function SupportTicketModal({ inventoryTitle = null, trigger = null }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [priority, setPriority] = useState('Average');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!summary.trim()) {
            toast.error(t('support.summary_required', 'Please describe your issue'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/support-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    summary: summary.trim(),
                    priority,
                    inventory: inventoryTitle,
                    link: window.location.href,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create ticket');
            }

            toast.success(
                t('support.ticket_created', 'Support ticket created!'),
                { description: data.ticketId }
            );

            // Reset form
            setSummary('');
            setPriority('Average');
            setOpen(false);

        } catch (error) {
            console.error('Support ticket error:', error);
            toast.error(error.message || t('support.error', 'Failed to create ticket'));
        } finally {
            setIsLoading(false);
        }
    };

    const priorityOptions = [
        { value: 'High', label: t('support.priority_high', 'High'), color: 'text-red-500' },
        { value: 'Average', label: t('support.priority_average', 'Average'), color: 'text-yellow-500' },
        { value: 'Low', label: t('support.priority_low', 'Low'), color: 'text-green-500' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-5 w-5" />
                        <span className="sr-only">{t('support.help', 'Help')}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            {t('support.title', 'Create Support Ticket')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('support.description', 'Describe your issue and our team will get back to you.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="summary">{t('support.summary', 'Summary')} *</Label>
                            <Textarea
                                id="summary"
                                placeholder={t('support.summary_placeholder', 'Describe your issue or question...')}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priority">{t('support.priority', 'Priority')}</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <span className={opt.color}>●</span> {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {inventoryTitle && (
                            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                <span className="font-medium">{t('support.inventory', 'Related Inventory')}:</span> {inventoryTitle}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('action.cancel', 'Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? t('support.sending', 'Sending...') : t('support.submit', 'Submit Ticket')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
