import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp, TrendingDown, Hash, Type, Loader2, BarChart3,
    ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { motion } from 'motion/react';

// Circular progress ring component
function CircularProgress({ value, size = 60, strokeWidth = 6, color = 'hsl(var(--primary))' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{value}%</span>
            </div>
        </div>
    );
}

// Horizontal bar for frequency display
function FrequencyBar({ value, maxValue, label, count }) {
    const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="truncate max-w-[150px]" title={value}>{value}</span>
                <span className="text-muted-foreground font-mono text-xs">{count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
            </div>
        </div>
    );
}

// Numeric stat gauge/display
function NumericGauge({ label, min, max, avg, sum, count }) {
    const range = max - min;
    const avgPosition = range > 0 ? ((avg - min) / range) * 100 : 50;

    return (
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <Hash className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                    {count} {t('stats.values', 'values')}
                </Badge>
            </div>

            {/* Range visualization */}
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-1 bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20 mx-3" />
                </div>
                {/* Average marker */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-background shadow-lg"
                    initial={{ left: '50%' }}
                    animate={{ left: `${avgPosition}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ marginLeft: '-6px' }}
                />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{t('stats.min', 'Min')}</div>
                    <div className="font-bold text-sm font-mono">{min?.toLocaleString()}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{t('stats.avg', 'Avg')}</div>
                    <div className="font-bold text-sm font-mono text-blue-500">{avg?.toLocaleString()}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{t('stats.max', 'Max')}</div>
                    <div className="font-bold text-sm font-mono">{max?.toLocaleString()}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{t('stats.sum', 'Sum')}</div>
                    <div className="font-bold text-sm font-mono">{sum?.toLocaleString()}</div>
                </div>
            </div>
        </div>
    );
}

// String breakdown component
function StringBreakdown({ label, topValues, uniqueCount }) {
    const maxCount = topValues?.[0]?.count || 1;

    return (
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <Type className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                    {uniqueCount} {t('stats.unique', 'unique')}
                </Badge>
            </div>

            <div className="space-y-2">
                {topValues?.map((item, idx) => (
                    <FrequencyBar
                        key={idx}
                        value={item.value}
                        count={item.count}
                        maxValue={maxCount}
                    />
                ))}
            </div>
        </div>
    );
}

export default function StatsTab({ inventoryId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/inventory/${inventoryId}/stats`, { headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    setError('Failed to load stats');
                }
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        };

        fetchStats();
    }, [inventoryId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-destructive">
                    {error}
                </CardContent>
            </Card>
        );
    }

    if (!stats || stats.totalItems === 0) {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">{t('stats.empty', 'Add items to see statistics')}</p>
                </CardContent>
            </Card>
        );
    }

    const { totalItems, numericStats, stringStats, completionRates } = stats;
    const hasNumeric = Object.keys(numericStats).length > 0;
    const hasString = Object.keys(stringStats).length > 0;
    const hasCompletion = Object.keys(completionRates).length > 0;

    return (
        <div className="space-y-6 mx-auto">
            {/* Overview header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl">
                <div className="p-3 rounded-full bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{t('stats.total_items', 'Total Items')}</p>
                </div>
            </div>

            {/* Completion Rates */}
            {hasCompletion && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('stats.completion', 'Field Completion')}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(completionRates).map(([key, { label, rate }]) => (
                            <div key={key} className="flex items-center gap-3">
                                <CircularProgress
                                    value={rate}
                                    size={56}
                                    color={rate >= 80 ? 'hsl(142, 76%, 36%)' : rate >= 50 ? 'hsl(48, 100%, 50%)' : 'hsl(0, 84%, 60%)'}
                                />
                                <span className="text-sm font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Numeric Stats */}
            {hasNumeric && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {t('stats.numeric_summary', 'Numeric Fields')}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(numericStats).map(([key, data]) => (
                            <NumericGauge key={key} {...data} />
                        ))}
                    </div>
                </div>
            )}

            {/* String Stats */}
            {hasString && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        {t('stats.string_breakdown', 'Text Field Breakdown')}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(stringStats).map(([key, data]) => (
                            <StringBreakdown key={key} {...data} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
