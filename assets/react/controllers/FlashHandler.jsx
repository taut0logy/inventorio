import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function FlashHandler({ messages = {} }) {
    useEffect(() => {
        if (!messages) return;

        Object.entries(messages).forEach(([type, msgs]) => {
            if (Array.isArray(msgs)) {
                msgs.forEach(msg => {
                    const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
                    
                    switch (type) {
                        case 'success':
                            toast.success(message);
                            break;
                        case 'error':
                        case 'danger':
                            toast.error(message);
                            break;
                        case 'warning':
                            toast.warning(message);
                            break;
                        default:
                            toast.info(message);
                    }
                });
            }
        });
    }, [messages]);

    return <Toaster position="top-right" richColors closeButton />;
}
