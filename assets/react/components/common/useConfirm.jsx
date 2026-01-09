import React, { useState, useCallback } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { t } from '@/lib/i18n';

export function useConfirm() {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        description: '',
        confirmText: '',
        cancelText: '',
        variant: 'default', // 'default' or 'destructive'
        onConfirm: null,
        onCancel: null
    });

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            // Support simple string generic usage
            if (typeof options === 'string') {
                options = { description: options };
            }

            setState({
                isOpen: true,
                title: options.title || t('confirm.default_title', 'Are you sure?'),
                description: options.description || '',
                confirmText: options.confirmText || t('action.continue', 'Continue'),
                cancelText: options.cancelText || t('action.cancel', 'Cancel'),
                variant: options.variant || 'destructive', // Default to destructive for safety
                onConfirm: () => {
                    setState(s => ({ ...s, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setState(s => ({ ...s, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const ConfirmDialog = useCallback(() => {
        return (
            <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && state.onCancel && state.onCancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {state.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={state.onCancel}>
                            {state.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={state.onConfirm}
                            className={state.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                        >
                            {state.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }, [state]);

    return [ConfirmDialog, confirm];
}
