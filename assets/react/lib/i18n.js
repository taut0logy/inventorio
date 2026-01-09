export function t(key, arg2, arg3) {
    let params = {};
    let fallback = '';

    if (typeof arg2 === 'object' && arg2 !== null) {
        params = arg2;
        fallback = arg3 || '';
    } else {
        fallback = arg2 || '';
    }

    let template = fallback;
    if (typeof window !== 'undefined' && window.INVENTORY_TRANSLATIONS && window.INVENTORY_TRANSLATIONS[key]) {
        template = window.INVENTORY_TRANSLATIONS[key];
    }

    if (!template) return '';

    return template.replace(/\{(\w+)\}/g, (match, p1) => {
        return params[p1] !== undefined ? params[p1] : match;
    });
}
