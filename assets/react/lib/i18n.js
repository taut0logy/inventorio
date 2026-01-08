export function t(key, fallback) {
    if (typeof window === 'undefined' || !window.INVENTORY_TRANSLATIONS) {
        return fallback;
    }
    return window.INVENTORY_TRANSLATIONS[key] || fallback;
}
