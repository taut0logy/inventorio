import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Plus } from 'lucide-react';
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
import { t } from '@/lib/i18n';

// Sortable option item component
function SortableOption({ option, index, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: option.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-2 bg-background border rounded-md group"
        >
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <Input
                value={option.value}
                onChange={(e) => onEdit(index, e.target.value)}
                className="flex-1 h-8"
                placeholder={t('fields.options.placeholder', 'Enter option text')}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(index)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default function SelectOptionsEditor({ options = [], onChange }) {
    const [newOption, setNewOption] = useState('');

    // Convert string array to objects with IDs for dnd-kit
    const optionItems = options.map((opt, i) => ({
        id: `option-${i}`,
        value: opt
    }));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = optionItems.findIndex(o => o.id === active.id);
            const newIndex = optionItems.findIndex(o => o.id === over.id);
            const newOptions = arrayMove(options, oldIndex, newIndex);
            onChange(newOptions);
        }
    };

    const handleAdd = () => {
        if (newOption.trim()) {
            onChange([...options, newOption.trim()]);
            setNewOption('');
        }
    };

    const handleEdit = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        onChange(newOptions);
    };

    const handleDelete = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        onChange(newOptions);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-2">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={optionItems.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {optionItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                {t('fields.options.empty', 'No options defined')}
                            </p>
                        ) : (
                            optionItems.map((option, index) => (
                                <SortableOption
                                    key={option.id}
                                    option={option}
                                    index={index}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="flex gap-2">
                <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('fields.options.placeholder', 'Enter option text')}
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAdd}
                    disabled={!newOption.trim()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
