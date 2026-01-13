import { useEffect, useRef } from 'react';

/**
 * Custom hook to subscribe to Mercure updates.
 * 
 * @param {string[]} topics - Array of topics to subscribe to
 * @param {Function} onMessage - Callback function when a message is received (data, type)
 */
export function useMercure(topics, onMessage) {
    const eventSourceRef = useRef(null);

    useEffect(() => {
        if (!topics || topics.length === 0) return;

        // Construct hub URL with topics
        // Check .env for public URL, falling back to localhost default
        const hubUrl = new URL(process.env.MERCURE_PUBLIC_URL || 'http://localhost:3000/.well-known/mercure');

        topics.forEach(topic => {
            hubUrl.searchParams.append('topic', topic);
        });

        console.log('[Mercure] Connecting to', hubUrl.toString());

        const eventSource = new EventSource(hubUrl.toString(), {
            withCredentials: true // Important if using private updates or cookie-based logic
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) {
                    onMessage(data.data, data.type);
                }
            } catch (err) {
                console.error('[Mercure] Failed to parse message', err);
            }
        };

        eventSource.onerror = (err) => {
            console.warn('[Mercure] Connection error', err);
            // EventSource auto-reconnects, but good to know
        };

        eventSourceRef.current = eventSource;

        return () => {
            console.log('[Mercure] Closing connection');
            eventSource.close();
        };
    }, [JSON.stringify(topics)]); // Re-connect if topics change
}
