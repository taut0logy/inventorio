import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// All available field slots
const ALL_FIELDS = [
    { key: 'string1', type: 'String', defaultLabel: 'Custom String 1' },
    { key: 'string2', type: 'String', defaultLabel: 'Custom String 2' },
    { key: 'string3', type: 'String', defaultLabel: 'Custom String 3' },
    { key: 'number1', type: 'Number', defaultLabel: 'Custom Number 1' },
    { key: 'number2', type: 'Number', defaultLabel: 'Custom Number 2' },
    { key: 'number3', type: 'Number', defaultLabel: 'Custom Number 3' },
    { key: 'text1', type: 'Text', defaultLabel: 'Custom Text 1' },
    { key: 'text2', type: 'Text', defaultLabel: 'Custom Text 2' },
    { key: 'text3', type: 'Text', defaultLabel: 'Custom Text 3' },
    { key: 'link1', type: 'Link', defaultLabel: 'Custom Link 1' },
    { key: 'link2', type: 'Link', defaultLabel: 'Custom Link 2' },
    { key: 'link3', type: 'Link', defaultLabel: 'Custom Link 3' },
    { key: 'select1', type: 'Select', defaultLabel: 'Custom Select 1' },
    { key: 'select2', type: 'Select', defaultLabel: 'Custom Select 2' },
    { key: 'select3', type: 'Select', defaultLabel: 'Custom Select 3' },
    { key: 'bool1', type: 'Boolean', defaultLabel: 'Custom Boolean 1' },
    { key: 'bool2', type: 'Boolean', defaultLabel: 'Custom Boolean 2' },
    { key: 'bool3', type: 'Boolean', defaultLabel: 'Custom Boolean 3' },
];

// Sortable Field Item
function SortableField({ id, field, config, onUpdate }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isVisible = !config?.hidden;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group p-3 sm:p-4 border rounded-lg bg-card mb-3 transition-colors ${!isVisible ? 'opacity-60 bg-muted/30' : 'hover:border-primary/50'}`}
        >
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                
                {/* Drag Handle & Visibility - Mobile: Row, Desktop: Left Column */}
                <div className="flex items-center justify-between sm:justify-start sm:w-auto gap-2">
                    <div className="flex items-center gap-2">
                        <button 
                            {...attributes} 
                            {...listeners} 
                            className="cursor-grab p-1.5 hover:bg-muted rounded-md touch-none active:cursor-grabbing"
                            title="Drag to reorder"
                        >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <Checkbox
                            checked={isVisible}
                            onCheckedChange={(checked) => onUpdate(field.key, { ...config, hidden: !checked })}
                            title="Toggle visibility"
                        />
                    </div>
                    {/* Mobile-only type badge */}
                    <span className="sm:hidden text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {field.type}
                    </span>
                </div>

                {/* Main Inputs Area */}
                <div className="flex-1 space-y-3 min-w-0">
                    
                    {/* Top Row: Label & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_2fr] gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Label</Label>
                            <Input
                                value={config?.label || ''}
                                onChange={(e) => onUpdate(field.key, { ...config, label: e.target.value })}
                                placeholder={field.defaultLabel}
                                className="h-9 bg-background"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Description (Tooltip)</Label>
                            <Input
                                value={config?.description || ''}
                                onChange={(e) => onUpdate(field.key, { ...config, description: e.target.value })}
                                placeholder="Helper text for users..."
                                className="h-9 bg-background"
                            />
                        </div>
                    </div>

                    {/* Validation Limits Row - Only show if visible */}
                    <div className={`pt-3 mt-1 border-t grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-1 ${!isVisible ? 'hidden' : ''}`}>
                        
                        {/* Required Checkbox */}
                        <div className="flex items-center gap-2 h-9">
                            <Checkbox 
                                id={`req-${field.key}`}
                                checked={config?.required || false}
                                onCheckedChange={(checked) => onUpdate(field.key, { ...config, required: checked })}
                            />
                            <Label htmlFor={`req-${field.key}`} className="text-sm cursor-pointer select-none">Required Field</Label>
                        </div>

                        {/* Regex (String/Text/Select) */}
                        {(field.type === 'String' || field.type === 'Text' || field.type === 'Select') && (
                            <div className="space-y-1 xl:col-span-2">
                                <Label className="text-xs text-muted-foreground">Validation Regex</Label>
                                <Input 
                                    value={config?.regex || ''}
                                    onChange={(e) => onUpdate(field.key, { ...config, regex: e.target.value })}
                                    placeholder="e.g. ^[A-Z]+$"
                                    className="h-8 text-xs font-mono bg-background"
                                />
                            </div>
                        )}

                        {/* Min/Max (Number) */}
                        {field.type === 'Number' && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Minimum Value</Label>
                                    <Input 
                                        type="number"
                                        value={config?.min ?? ''}
                                        onChange={(e) => onUpdate(field.key, { ...config, min: e.target.value })}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Maximum Value</Label>
                                    <Input 
                                        type="number"
                                        value={config?.max ?? ''}
                                        onChange={(e) => onUpdate(field.key, { ...config, max: e.target.value })}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                     
                    {/* Select Options - Full Width */}
                     {field.type === 'Select' && isVisible && (
                        <div className="space-y-1 pt-1 animate-in fade-in">
                            <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
                            <Textarea 
                                value={config?.options || ''}
                                onChange={(e) => onUpdate(field.key, { ...config, options: e.target.value })}
                                placeholder="Option 1, Option 2, Option 3..."
                                className="min-h-[60px] text-xs bg-background resize-y"
                            />
                        </div>
                    )}
                </div>

                {/* Right Side Actions / Badge (Desktop) */}
                <div className="hidden sm:flex flex-col items-end gap-2 pl-2 border-l">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded w-full text-center">
                        {field.type}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={isVisible ? "Hide field" : "Show field"}
                        onClick={() => onUpdate(field.key, { ...config, hidden: !config?.hidden })}
                    >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CustomFieldsEditor({ value, onChange }) {
    // Initialize order and fields from value
    const [order, setOrder] = useState(() => {
        if (value?.order && Array.isArray(value.order) && value.order.length > 0) {
            return value.order;
        }
        // Default: all fields in their standard order
        return ALL_FIELDS.map(f => f.key);
    });

    const [fields, setFields] = useState(() => {
        if (value?.fields && Object.keys(value.fields).length > 0) {
            return value.fields;
        }
        // Default: only first 3 fields visible, rest hidden
        const defaultFields = {};
        ALL_FIELDS.forEach((f, index) => {
            defaultFields[f.key] = { hidden: index >= 3 }; // First 3 visible, rest hidden
        });
        return defaultFields;
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                emitChange(newOrder, fields);
                return newOrder;
            });
        }
    };

    const emitChange = (newOrder, newFields) => {
        onChange({
            order: newOrder,
            fields: newFields
        });
    };

    const updateField = (key, config) => {
        const newFields = { ...fields, [key]: config };
        setFields(newFields);
        emitChange(order, newFields);
    };

    // Create ordered list of field definitions
    const orderedFields = order.map(key => {
        const fieldDef = ALL_FIELDS.find(f => f.key === key);
        return fieldDef || null;
    }).filter(Boolean);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Fields</Label>
                <span className="text-xs text-muted-foreground">Drag to reorder • Toggle visibility</span>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={order} strategy={verticalListSortingStrategy}>
                    {orderedFields.map((field) => (
                        <SortableField
                            key={field.key}
                            id={field.key}
                            field={field}
                            config={fields[field.key] || {}}
                            onUpdate={updateField}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
}
