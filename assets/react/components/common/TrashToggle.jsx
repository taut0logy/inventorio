import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Reply } from 'lucide-react'; // Reply logic for "Back to Active" if we prefer
import { t } from '@/lib/i18n';

export function TrashToggle({ showDeleted, onToggle }) {
    return (
        <Button
            variant={showDeleted ? "destructive" : "outline"}
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-2 transition-colors"
        >
            <Trash2 className="h-4 w-4" />
            {showDeleted ? t('common.hide_trash', 'Hide Trash') : t('common.show_trash', 'Show Trash')}
        </Button>
    );
}
