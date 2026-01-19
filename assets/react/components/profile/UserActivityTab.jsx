import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Eye, Heart, Plus, Pencil, Trash2, Settings,
    UserPlus, Check, X, Loader2, ChevronLeft, ChevronRight,
    Activity as ActivityIcon, UserMinus, UserCheck, Package
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useMercure } from '@/hooks/use-mercure';

const ACTIVITY_TYPES = [
    { key: 'view', labelKey: 'filter.views', fallback: 'Views', icon: Eye },
    { key: 'like', labelKey: 'filter.likes', fallback: 'Likes', icon: Heart },
    { key: 'item_add', labelKey: 'filter.items_added', fallback: 'Added', icon: Plus },
    { key: 'item_edit', labelKey: 'filter.item_edits', fallback: 'Edits', icon: Pencil },
    { key: 'item_delete', labelKey: 'filter.item_deletions', fallback: 'Deletions', icon: Trash2 },
    { key: 'inventory_edit', labelKey: 'filter.settings', fallback: 'Settings', icon: Settings },
];

const ACCESS_TYPES = [
    { key: 'permission_request', labelKey: 'filter.requests', fallback: 'Requests', icon: UserPlus },
    { key: 'permission_granted', labelKey: 'filter.granted', fallback: 'Granted', icon: Check },
    { key: 'permission_denied', labelKey: 'filter.denied', fallback: 'Denied', icon: X },
    { key: 'collaborator_added', labelKey: 'filter.collaborator_added', fallback: 'Users Added', icon: UserCheck },
    { key: 'collaborator_removed', labelKey: 'filter.collaborator_removed', fallback: 'Users Removed', icon: UserMinus },
];

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function getActivityText(activity) {
    const type = activity.type;
    const meta = activity.metadata || {};
    const inventoryTitle = activity.inventory?.title || '';

    switch (type) {
        case 'view':
            return t('activity.viewed_inventory', `viewed ${inventoryTitle}`);
        case 'like':
            return t('activity.liked_inventory', `liked ${inventoryTitle}`);
        case 'item_add':
            return t('activity.item_add_inventory', `added item to ${inventoryTitle}`);
        case 'item_edit':
            return t('activity.item_edit_inventory', `edited item in ${inventoryTitle}`);
        case 'item_delete':
            return t('activity.item_delete_inventory', `deleted item from ${inventoryTitle}`);
        case 'inventory_edit':
            return t('activity.inventory_edit_self', `updated settings for ${inventoryTitle}`);
        case 'permission_request':
            return t('activity.permission_request', 'requested access');
        case 'permission_granted':
            return t('activity.permission_granted', `granted access to ${meta.grantedToName || 'a user'}`);
        case 'permission_denied':
            return t('activity.permission_denied', `denied access to ${meta.deniedUserName || 'a user'}`);
        case 'collaborator_added':
            return t('activity.collaborator_added', 'added a collaborator');
        case 'collaborator_removed':
            return t('activity.collaborator_removed', 'removed a collaborator');
        default:
            return type;
    }
}

function getActivityIcon(type) {
    const allTypes = [...ACTIVITY_TYPES, ...ACCESS_TYPES];
    const found = allTypes.find(t => t.key === type);
    return found ? found.icon : ActivityIcon;
}

export default function UserActivityTab({ userId, canSeeAccessEvents }) {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({});
    const [activeTypes, setActiveTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            if (activeTypes.length > 0) {
                activeTypes.forEach(t => params.append('types[]', t));
            }

            const res = await fetch(`/user/${userId}/activities?${params}`, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities);
                setStats(data.stats);
                setTotalPages(data.pages);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
        }
        setLoading(false);
    }, [userId, page, activeTypes]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // Real-time updates
    useMercure([`/user/${userId}/activities`], (data, type) => {
        if (type === 'activity') {
            const activity = data;

            // Only prepend if it matches current filter
            if (activeTypes.length > 0 && !activeTypes.includes(activity.type)) {
                return;
            }

            // Update stats
            setStats(prev => ({
                ...prev,
                [activity.type]: (prev[activity.type] || 0) + 1
            }));

            // Prepend to list if on page 1
            if (page === 1) {
                setActivities(prev => {
                    if (prev.some(a => a.id === activity.id)) return prev;
                    return [activity, ...prev];
                });
            }
        }
    });

    const toggleType = (type) => {
        setActiveTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Compact Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{stats['view'] || 0}</span>
                    <span className="text-muted-foreground">{t('activity.views', 'views')}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-sm">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{stats['like'] || 0}</span>
                    <span className="text-muted-foreground">{t('activity.likes', 'likes')}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-sm">
                    <Plus className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{stats['item_add'] || 0}</span>
                    <span className="text-muted-foreground">{t('activity.items_added', 'added')}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-sm">
                    <Pencil className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{stats['item_edit'] || 0}</span>
                    <span className="text-muted-foreground">{t('activity.edits', 'edits')}</span>
                </div>
            </div>

            {/* Type Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                        {ACTIVITY_TYPES.map(({ key, labelKey, fallback, icon: Icon }) => (
                            <Badge
                                key={key}
                                variant={activeTypes.includes(key) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleType(key)}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {t(labelKey, fallback)}
                            </Badge>
                        ))}
                        {canSeeAccessEvents && ACCESS_TYPES.map(({ key, labelKey, fallback, icon: Icon }) => (
                            <Badge
                                key={key}
                                variant={activeTypes.includes(key) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleType(key)}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {t(labelKey, fallback)}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4" />
                        {t('activity.feed', 'Activity Feed')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('activity.empty', 'No activity yet')}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {activities.map(activity => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-center gap-3 py-3 border-b last:border-0"
                                    >
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">
                                                    {getActivityText(activity)}
                                                </span>
                                                {activity.inventory && (
                                                    <a
                                                        href={`/inventory/${activity.inventory.id}`}
                                                        className="font-medium hover:underline ml-1"
                                                    >
                                                        {activity.inventory.title}
                                                    </a>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                            <span className="text-xs whitespace-nowrap">
                                                {formatRelativeTime(activity.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {t('pagination.page', 'Page')} {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
