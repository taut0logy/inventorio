import React, { useState, useId } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, Plus, Trash2, HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Element type definitions
const ELEMENT_TYPES = {
    fixed: { label: 'Fixed Text', description: 'Static text (e.g., "INV", "-")' },
    random20: { label: '20-bit Random', description: 'Random number (0-1,048,575)' },
    random32: { label: '32-bit Random', description: 'Random number (0-4,294,967,295)' },
    random6: { label: '6-digit Random', description: 'Random 6-digit number' },
    random9: { label: '9-digit Random', description: 'Random 9-digit number' },
    guid: { label: 'GUID', description: 'Unique UUID v4' },
    date: { label: 'Date/Time', description: 'Creation timestamp' },
    sequence: { label: 'Sequence', description: 'Auto-increment number' },
};

// Generate a sample preview for an element
function generateElementPreview(element) {
    switch (element.type) {
        case 'fixed':
            return element.value || '';
        case 'random20':
            return element.format === 'hex' ? 'A3F2B' : '673521';
        case 'random32':
            return element.format === 'hex' ? 'E74FA329' : '3879920425';
        case 'random6':
            return '847293';
        case 'random9':
            return '847293156';
        case 'guid':
            return 'a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5';
        case 'date':
            const now = new Date();
            if (element.format === 'YYYYMMDD') return now.toISOString().slice(0, 10).replace(/-/g, '');
            if (element.format === 'YYYY-MM-DD') return now.toISOString().slice(0, 10);
            return now.getFullYear().toString(); // Default YYYY
        case 'sequence':
            const minDigits = element.minDigits || 4;
            return '1'.padStart(minDigits, '0');
        default:
            return '???';
    }
}

// Sortable Element Item
function SortableElement({ id, element, onUpdate, onRemove }) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-2 border rounded-md bg-card mb-2"
        >
            <button {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            <Badge variant="secondary" className="min-w-[100px] justify-center">
                {ELEMENT_TYPES[element.type]?.label || element.type}
            </Badge>

            {/* Options based on type */}
            <div className="flex-1 flex items-center gap-2">
                {element.type === 'fixed' && (
                    <Input
                        value={element.value || ''}
                        onChange={(e) => onUpdate({ ...element, value: e.target.value })}
                        placeholder="Text..."
                        className="h-8 max-w-[150px]"
                    />
                )}

                {(element.type === 'random20' || element.type === 'random32') && (
                    <Select
                        value={element.format || 'hex'}
                        onValueChange={(val) => onUpdate({ ...element, format: val })}
                    >
                        <SelectTrigger className="h-8 w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hex">Hex</SelectItem>
                            <SelectItem value="dec">Decimal</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {element.type === 'date' && (
                    <Select
                        value={element.format || 'YYYY'}
                        onValueChange={(val) => onUpdate({ ...element, format: val })}
                    >
                        <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="YYYY">Year (2026)</SelectItem>
                            <SelectItem value="YYYYMMDD">Full (20260109)</SelectItem>
                            <SelectItem value="YYYY-MM-DD">ISO (2026-01-09)</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {element.type === 'sequence' && (
                    <div className="flex items-center gap-1">
                        <Label className="text-xs text-muted-foreground">Digits:</Label>
                        <Input
                            type="number"
                            min={1}
                            max={10}
                            value={element.minDigits || 4}
                            onChange={(e) => onUpdate({ ...element, minDigits: parseInt(e.target.value) || 4 })}
                            className="h-8 w-[60px]"
                        />
                    </div>
                )}
            </div>

            <span className="text-xs text-muted-foreground font-mono">
                {generateElementPreview(element)}
            </span>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemove(id)}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

export default function CustomIdBuilder({ value, onChange }) {
    // Parse or initialize elements
    const [elements, setElements] = useState(() => {
        if (value?.elements && Array.isArray(value.elements)) {
            return value.elements.map((el, i) => ({ ...el, id: `el-${i}` }));
        }
        // Default: simple sequence
        return [
            { id: 'el-0', type: 'sequence', minDigits: 4 }
        ];
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
            setElements((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                emitChange(newItems);
                return newItems;
            });
        }
    };

    const emitChange = (newElements) => {
        onChange({
            elements: newElements.map(({ id, ...rest }) => rest) // Remove id before saving
        });
    };

    const addElement = (type) => {
        const newEl = { id: `el-${Date.now()}`, type };
        if (type === 'fixed') newEl.value = '-';
        if (type === 'sequence') newEl.minDigits = 4;
        if (type === 'date') newEl.format = 'YYYY';
        if (type === 'random20' || type === 'random32') newEl.format = 'hex';

        const newElements = [...elements, newEl];
        setElements(newElements);
        emitChange(newElements);
    };

    const updateElement = (id, newData) => {
        const newElements = elements.map((el) => (el.id === id ? { ...newData, id } : el));
        setElements(newElements);
        emitChange(newElements);
    };

    const removeElement = (id) => {
        const newElements = elements.filter((el) => el.id !== id);
        setElements(newElements);
        emitChange(newElements);
    };

    // Generate full preview
    const fullPreview = elements.map(generateElementPreview).join('');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">ID Elements</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Element
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {Object.entries(ELEMENT_TYPES).map(([key, { label, description }]) => (
                            <TooltipProvider key={key}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem onClick={() => addElement(key)}>
                                            {label}
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p className="text-xs">{description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={elements} strategy={verticalListSortingStrategy}>
                    {elements.map((element) => (
                        <SortableElement
                            key={element.id}
                            id={element.id}
                            element={element}
                            onUpdate={(data) => updateElement(element.id, data)}
                            onRemove={removeElement}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {elements.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed rounded-md text-muted-foreground">
                    No elements. Add one to build your ID format.
                </div>
            )}

            {/* Live Preview */}
            <div className="p-3 bg-muted/50 rounded-md">
                <Label className="text-xs text-muted-foreground mb-1 block">Live Preview</Label>
                <code className="text-lg font-mono font-semibold text-primary">
                    {fullPreview || '(empty)'}
                </code>
            </div>
        </div>
    );
}
