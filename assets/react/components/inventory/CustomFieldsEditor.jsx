import React, { useState, useEffect } from 'react';
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
import { GripVertical, Eye, EyeOff, Trash2, Plus, Type, Hash, FileText, Link, ToggleLeft, List } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SelectOptionsEditor from './SelectOptionsEditor';
import { t } from '@/lib/i18n';

// Field type definitions
const FIELD_TYPES = [
    { value: 'string', label: 'String', icon: Type, description: 'Short text' },
    { value: 'number', label: 'Number', icon: Hash, description: 'Numeric values' },
    { value: 'text', label: 'Text', icon: FileText, description: 'Multi-line text' },
    { value: 'link', label: 'Link', icon: Link, description: 'URL/hyperlink' },
    { value: 'boolean', label: 'Boolean', icon: ToggleLeft, description: 'True/false' },
    { value: 'select', label: 'Select', icon: List, description: 'Dropdown options' },
];

// Helper to generate a new field ID
const generateFieldId = () => `field_${crypto.randomUUID().split('-')[0]}`;

// Sortable Field Item Component
function SortableField({ field, onUpdate, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isVisible = !field.hidden;
    const typeInfo = FIELD_TYPES.find(t => t.value === field.type) || FIELD_TYPES[0];
    const TypeIcon = typeInfo.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group p-3 sm:p-4 border rounded-lg bg-card mb-3 transition-colors ${!isVisible ? 'opacity-60 bg-muted/30' : 'hover:border-primary/50'}`}
        >
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">

                {/* Drag Handle & Visibility */}
                <div className="flex items-center justify-between sm:justify-start sm:w-auto gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            {...attributes}
                            {...listeners}
                            className="cursor-grab p-1.5 hover:bg-muted rounded-md touch-none active:cursor-grabbing"
                            title={t('action.drag_reorder', 'Drag to reorder')}
                        >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <Checkbox
                            checked={isVisible}
                            onCheckedChange={(checked) => onUpdate({ ...field, hidden: !checked })}
                            title={t('action.toggle_visibility', 'Toggle visibility')}
                        />
                    </div>
                    {/* Mobile-only type badge */}
                    <span className="sm:hidden text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                    </span>
                </div>

                {/* Main Inputs Area */}
                <div className="flex-1 space-y-3 min-w-0">

                    {/* Top Row: Label & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_2fr] gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">{t('fields.label', 'Label')}</Label>
                            <Input
                                value={field.label || ''}
                                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                                placeholder={t('fields.label_placeholder', 'Field name')}
                                className="h-9 bg-background"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">{t('fields.description', 'Description')}</Label>
                            <Input
                                value={field.description || ''}
                                onChange={(e) => onUpdate({ ...field, description: e.target.value })}
                                placeholder={t('fields.description_placeholder', 'Helper text for users...')}
                                className="h-9 bg-background"
                            />
                        </div>
                    </div>

                    {/* Validation Row - Only show if visible */}
                    <div className={`pt-3 mt-1 border-t grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-1 ${!isVisible ? 'hidden' : ''}`}>

                        {/* Required Checkbox */}
                        <div className="flex items-center gap-2 h-9">
                            <Checkbox
                                id={`req-${field.id}`}
                                checked={field.required || false}
                                onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
                            />
                            <Label htmlFor={`req-${field.id}`} className="text-sm cursor-pointer select-none">
                                {t('fields.required', 'Required')}
                            </Label>
                        </div>

                        {/* Regex (String/Text/Link) */}
                        {['string', 'text', 'link'].includes(field.type) && (
                            <div className="space-y-1 xl:col-span-2">
                                <Label className="text-xs text-muted-foreground">{t('fields.regex', 'Validation Regex')}</Label>
                                <Input
                                    value={field.regex || ''}
                                    onChange={(e) => onUpdate({ ...field, regex: e.target.value })}
                                    placeholder="e.g. ^[A-Z]+$"
                                    className="h-8 text-xs font-mono bg-background"
                                />
                            </div>
                        )}

                        {/* Min/Max (Number) */}
                        {field.type === 'number' && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('fields.min', 'Minimum')}</Label>
                                    <Input
                                        type="number"
                                        value={field.min ?? ''}
                                        onChange={(e) => onUpdate({ ...field, min: e.target.value === '' ? null : parseFloat(e.target.value) })}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('fields.max', 'Maximum')}</Label>
                                    <Input
                                        type="number"
                                        value={field.max ?? ''}
                                        onChange={(e) => onUpdate({ ...field, max: e.target.value === '' ? null : parseFloat(e.target.value) })}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Select Options - Full Width */}
                    {field.type === 'select' && isVisible && (
                        <div className="space-y-1 pt-1 animate-in fade-in">
                            <Label className="text-xs text-muted-foreground">{t('fields.options', 'Options')}</Label>
                            <SelectOptionsEditor
                                options={field.options || []}
                                onChange={(newOptions) => onUpdate({ ...field, options: newOptions })}
                            />
                        </div>
                    )}
                </div>

                {/* Right Side Actions (Desktop) */}
                <div className="hidden sm:flex flex-col items-end gap-2 pl-2 border-l">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded w-full text-center flex items-center justify-center gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={isVisible ? t('action.hide', 'Hide field') : t('action.show', 'Show field')}
                        onClick={() => onUpdate({ ...field, hidden: !field.hidden })}
                    >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title={t('action.delete', 'Delete field')}
                        onClick={() => onDelete(field)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CustomFieldsEditor({ fields = [], onChange }) {
    const [fieldList, setFieldList] = useState(fields);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, field: null });

    useEffect(() => {
        setFieldList(fields);
    }, [fields]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fieldList.findIndex(f => f.id === active.id);
            const newIndex = fieldList.findIndex(f => f.id === over.id);
            const newFields = arrayMove(fieldList, oldIndex, newIndex).map((f, i) => ({ ...f, position: i }));
            setFieldList(newFields);
            onChange(newFields);
        }
    };

    const handleAddField = (type) => {
        const typeInfo = FIELD_TYPES.find(t => t.value === type);
        const newField = {
            id: generateFieldId(),
            type: type,
            label: `New ${typeInfo?.label || 'Field'}`,
            description: '',
            position: fieldList.length,
            hidden: false,
            required: false,
            regex: null,
            min: null,
            max: null,
            options: type === 'select' ? [] : null,
        };
        const newFields = [...fieldList, newField];
        setFieldList(newFields);
        onChange(newFields);
    };

    const handleUpdateField = (updatedField) => {
        const newFields = fieldList.map(f => f.id === updatedField.id ? updatedField : f);
        setFieldList(newFields);
        onChange(newFields);
    };

    const handleDeleteField = (field) => {
        setDeleteDialog({ open: true, field });
    };

    const confirmDelete = () => {
        if (deleteDialog.field) {
            const newFields = fieldList.filter(f => f.id !== deleteDialog.field.id).map((f, i) => ({ ...f, position: i }));
            setFieldList(newFields);
            onChange(newFields);
        }
        setDeleteDialog({ open: false, field: null });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm font-medium">{t('fields.title', 'Custom Fields')}</Label>
                    <p className="text-xs text-muted-foreground">{t('fields.subtitle', 'Drag to reorder • Toggle visibility')}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            {t('fields.add', 'Add Field')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {FIELD_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <DropdownMenuItem
                                    key={type.value}
                                    onClick={() => handleAddField(type.value)}
                                    className="cursor-pointer"
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    <div>
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {fieldList.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">{t('fields.no_fields', 'No custom fields defined')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('fields.add_prompt', 'Click "Add Field" to get started')}</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={fieldList.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        {fieldList.map((field) => (
                            <SortableField
                                key={field.id}
                                field={field}
                                onUpdate={handleUpdateField}
                                onDelete={handleDeleteField}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('fields.delete_title', 'Delete Field')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('fields.delete_message', 'Are you sure you want to delete this field? This action cannot be undone and may affect existing items.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('action.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('action.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
