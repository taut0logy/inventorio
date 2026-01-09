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
            className={`flex items-center gap-3 p-3 border rounded-md bg-card mb-2 ${!isVisible ? 'opacity-50' : ''}`}
        >
            <button {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            <Checkbox
                checked={isVisible}
                onCheckedChange={(checked) => onUpdate(field.key, { ...config, hidden: !checked })}
            />

            <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs text-muted-foreground">Label</Label>
                    <Input
                        value={config?.label || ''}
                        onChange={(e) => onUpdate(field.key, { ...config, label: e.target.value })}
                        placeholder={field.defaultLabel}
                        className="h-8"
                    />
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Description (tooltip)</Label>
                    <Input
                        value={config?.description || ''}
                        onChange={(e) => onUpdate(field.key, { ...config, description: e.target.value })}
                        placeholder="Hint for users..."
                        className="h-8"
                    />
                </div>
            </div>

            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {field.type}
            </span>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdate(field.key, { ...config, hidden: !config?.hidden })}
            >
                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
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
