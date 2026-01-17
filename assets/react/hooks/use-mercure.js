import { useEffect, useRef } from 'react';

/**
 * Custom hook to subscribe to Mercure updates.
 * 
 * @param {string[]} topics - Array of topics to subscribe to
 * @param {Function} onMessage - Callback function when a message is received (data, type)
 */
export function useMercure(topics, onMessage) {
    const eventSourceRef = useRef(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!topics || topics.length === 0) return;

        const hubUrl = new URL(process.env.MERCURE_PUBLIC_URL || 'http://localhost:3000/.well-known/mercure');

        topics.forEach(topic => {
            hubUrl.searchParams.append('topic', topic);
        });

        //console.log('[Mercure] Connecting to', hubUrl.toString());

        const eventSource = new EventSource(hubUrl.toString(), {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current?.(data.data, data.type);
            } catch (err) {
                console.error('[Mercure] Failed to parse message', err);
            }
        };

        eventSource.onerror = (err) => {
            console.warn('[Mercure] Connection error', err);
        };

        eventSourceRef.current = eventSource;

        return () => {
            console.log('[Mercure] Closing connection');
            eventSource.close();
        };
    }, [JSON.stringify(topics)]);
}
