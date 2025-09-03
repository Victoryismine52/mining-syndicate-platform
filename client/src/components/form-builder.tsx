import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FieldLibrary {
  id: string;
  name: string;
  label: string;
  dataType: string;
  category: string;
  defaultValidation: any;
  isSystemField: boolean;
}

interface FormTemplateField {
  id: string;
  fieldLibraryId: string;
  isRequired: boolean;
  order: string;
  customLabel?: string;
  placeholder?: string;
  customValidation: any;
  fieldLibrary: FieldLibrary;
}

interface FormBuilderProps {
  formTemplateId?: string;
  onFieldsChange?: (fields: FormTemplateField[]) => void;
}

// Sortable Form Field Component
function SortableFormField({ field, onConfigure, onRemove }: { 
  field: FormTemplateField; 
  onConfigure: (field: FormTemplateField) => void;
  onRemove: (fieldId: string) => void;
}) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-slate-700/50 border border-slate-600 rounded-lg"
      data-testid={`form-field-${field.fieldLibrary?.name || field.id}`}
    >
      <div
        className="cursor-move text-slate-400 hover:text-slate-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">
            {field.customLabel || field.fieldLibrary?.label || 'Unknown Field'}
          </span>
          {field.isRequired && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {field.fieldLibrary?.dataType || 'text'}
          </Badge>
        </div>
        {field.placeholder && (
          <div className="text-xs text-slate-400 mt-1">
            Placeholder: {field.placeholder}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onConfigure(field)}
          className="text-slate-400 hover:text-white"
          data-testid={`button-configure-${field.fieldLibrary?.name || field.id}`}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(field.id)}
          className="text-red-400 hover:text-red-300"
          data-testid={`button-remove-${field.fieldLibrary?.name || field.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function FormBuilder({ formTemplateId, onFieldsChange }: FormBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFields, setSelectedFields] = useState<FormTemplateField[]>([]);
  const [draggedField, setDraggedField] = useState<FieldLibrary | null>(null);
  const [isFieldConfigOpen, setIsFieldConfigOpen] = useState(false);
  const [configField, setConfigField] = useState<FormTemplateField | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation to batch update field orders
  const updateFieldOrdersMutation = useMutation({
    mutationFn: async (fieldUpdates: { id: string; order: string }[]) => {
      if (!formTemplateId) return;
      await apiRequest('PUT', `/api/form-templates/${formTemplateId}/fields/order`, { fieldUpdates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/form-templates/${formTemplateId}/fields`] });
      toast({
        title: "Order updated",
        description: "Field order has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order",
        description: "There was an error saving the field order.",
        variant: "destructive",
      });
      console.error("Error updating field order:", error);
    }
  });

  // Fetch field library
  const { data: fieldLibrary = [], error: fieldLibraryError, isLoading: isFieldLibraryLoading } = useQuery<FieldLibrary[]>({
    queryKey: ["/api/field-library"],
    retry: 1,
  });

  // Fetch existing form template fields if editing
  const { data: existingFields = [] } = useQuery<FormTemplateField[]>({
    queryKey: [`/api/form-templates/${formTemplateId}/fields`],
    enabled: !!formTemplateId,
  });

  // Load existing fields when editing - prevent infinite loops with proper dependency management
  useEffect(() => {
    if (!formTemplateId) {
      setSelectedFields([]);
      return;
    }

    if (existingFields && existingFields.length > 0) {
      const sortedFields = [...existingFields].sort((a, b) => 
        parseInt(a.order) - parseInt(b.order)
      );
      setSelectedFields(sortedFields);
    } else {
      setSelectedFields([]);
    }
  }, [formTemplateId, existingFields?.length]);

  // Memoize expensive computations to prevent re-computation on every render
  const usedFieldIds = useMemo(() => 
    selectedFields.map(f => f.fieldLibraryId), 
    [selectedFields]
  );
  
  const availableFields = useMemo(() => 
    fieldLibrary.filter(field => !usedFieldIds.includes(field.id)),
    [fieldLibrary, usedFieldIds]
  );
  
  const groupedFields = useMemo(() => 
    availableFields.reduce((acc, field) => {
      const category = field.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(field);
      return acc;
    }, {} as Record<string, FieldLibrary[]>),
    [availableFields]
  );

  const handleDragStart = (field: FieldLibrary) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      addField(draggedField);
      setDraggedField(null);
    }
  };

  const addField = (field: FieldLibrary) => {
    // Check if field is already added
    const exists = selectedFields.some(f => f.fieldLibraryId === field.id);
    if (exists) {
      toast({
        title: "Field already added",
        description: "This field is already in your form",
        variant: "destructive",
      });
      return;
    }

    const newField: FormTemplateField = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique temporary ID
      fieldLibraryId: field.id,
      isRequired: field.defaultValidation?.required || false,
      order: (selectedFields.length + 1).toString(),
      customLabel: "",
      placeholder: "",
      customValidation: field.defaultValidation || {},
      fieldLibrary: field,
    };

    setSelectedFields(prev => {
      const updatedFields = [...prev, newField];
      onFieldsChange?.(updatedFields);
      return updatedFields;
    });
  };

  const removeField = (fieldId: string) => {
    const updatedFields = selectedFields.filter(f => f.id !== fieldId);
    setSelectedFields(updatedFields);
    onFieldsChange?.(updatedFields);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...selectedFields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    
    // Update order values
    updatedFields.forEach((field, index) => {
      field.order = (index + 1).toString();
    });
    
    setSelectedFields(updatedFields);
    onFieldsChange?.(updatedFields);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        newItems.forEach((field, index) => {
          field.order = (index + 1).toString();
        });
        
        // Persist the order changes to the backend
        if (formTemplateId) {
          const fieldUpdates = newItems
            .filter(field => !field.id.startsWith('temp-')) // Only update persisted fields
            .map(field => ({
              id: field.id,
              order: field.order
            }));
          
          if (fieldUpdates.length > 0) {
            updateFieldOrdersMutation.mutate(fieldUpdates);
          }
        }
        
        onFieldsChange?.(newItems);
        return newItems;
      });
    }
  };

  const openFieldConfig = (field: FormTemplateField) => {
    setConfigField(field);
    setIsFieldConfigOpen(true);
  };

  const updateFieldConfig = (updates: Partial<FormTemplateField>) => {
    if (!configField) return;
    
    const updatedFields = selectedFields.map(f => 
      f.id === configField.id ? { ...f, ...updates } : f
    );
    setSelectedFields(updatedFields);
    onFieldsChange?.(updatedFields);
    setIsFieldConfigOpen(false);
    setConfigField(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "contact": return "👤";
      case "business": return "🏢";
      case "content": return "📝";
      case "preferences": return "⚙️";
      case "financial": return "💰";
      case "system": return "🔧";
      default: return "📋";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Field Library */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Field Library</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setIsAddFieldOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-add-field"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {isFieldLibraryLoading ? (
              <div className="text-center text-slate-400 py-8">
                <div className="text-sm">Loading field library...</div>
              </div>
            ) : fieldLibraryError ? (
              <div className="text-center text-slate-400 py-8">
                <div className="text-sm text-red-400">Error loading field library</div>
                <div className="text-xs mt-1">Try refreshing the page or re-authenticating</div>
              </div>
            ) : fieldLibrary.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <div className="text-sm">No fields available</div>
                <div className="text-xs mt-1">Click "Add Field" to create your first field</div>
              </div>
            ) : Object.keys(groupedFields).length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <div className="text-sm">All fields in use</div>
                <div className="text-xs mt-1">All available fields are already added to this form</div>
                <div className="text-xs mt-1">Click "Add Field" to create new custom fields</div>
              </div>
            ) : (
              Object.entries(groupedFields).map(([category, fields]) => (
                <div key={category} className="space-y-2">
                <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>{getCategoryIcon(category)}</span>
                  {category}
                </h4>
                <div className="space-y-1">
                  {fields.map(field => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => handleDragStart(field)}
                      onClick={() => addField(field)}
                      className="p-2 bg-slate-700/50 border border-slate-600 rounded cursor-pointer hover:bg-slate-600/50 transition-colors"
                      data-testid={`field-library-${field.name}`}
                    >
                      <div className="text-sm text-white">{field.label}</div>
                      <div className="text-xs text-slate-400">{field.dataType}</div>
                      {field.defaultValidation?.required && (
                        <Badge variant="secondary" className="mt-1 text-xs">Required</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Builder */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-[200px] max-h-[400px] p-4 border-2 border-dashed border-slate-600 rounded-lg overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-testid="form-builder-drop-zone"
            >
              {selectedFields.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Drag fields from the library or click to add them</p>
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={selectedFields.map(field => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {selectedFields.filter(Boolean).map((field) => (
                        <SortableFormField
                          key={field.id}
                          field={field}
                          onConfigure={openFieldConfig}
                          onRemove={removeField}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Configuration Dialog */}
      <Dialog open={isFieldConfigOpen} onOpenChange={setIsFieldConfigOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Configure Field</DialogTitle>
            <DialogDescription className="text-slate-400">
              Customize the field properties and validation
            </DialogDescription>
          </DialogHeader>
          
          {configField && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Custom Label</Label>
                <Input
                  value={configField.customLabel || ""}
                  onChange={(e) => setConfigField({
                    ...configField,
                    customLabel: e.target.value
                  })}
                  placeholder={configField.fieldLibrary.label}
                  className="bg-slate-700/50 border-slate-600"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty to use default: {configField.fieldLibrary.label}
                </p>
              </div>

              <div>
                <Label className="text-slate-300">Placeholder Text</Label>
                <Input
                  value={configField.placeholder || ""}
                  onChange={(e) => setConfigField({
                    ...configField,
                    placeholder: e.target.value
                  })}
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={configField.isRequired}
                  onCheckedChange={(checked) => setConfigField({
                    ...configField,
                    isRequired: checked as boolean
                  })}
                />
                <Label htmlFor="required" className="text-slate-300">
                  Required field
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFieldConfigOpen(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => updateFieldConfig(configField)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Field Dialog */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new field for the field library
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const newField = {
              name: formData.get('name') as string,
              label: formData.get('label') as string,
              dataType: formData.get('dataType') as string,
              category: formData.get('category') as string,
              defaultValidation: {
                required: formData.get('required') === 'on'
              },
              isSystemField: false
            };
            
            try {
              await apiRequest('/api/field-library', 'POST', newField);
              queryClient.invalidateQueries({ queryKey: ['/api/field-library'] });
              setIsAddFieldOpen(false);
              toast({ title: 'Field created successfully' });
            } catch (error: any) {
              toast({ 
                title: 'Error creating field', 
                description: error.message,
                variant: 'destructive' 
              });
            }
          }} className="space-y-4">
            <div>
              <Label className="text-slate-300">Field Name</Label>
              <Input
                name="name"
                placeholder="e.g., investment_amount"
                className="bg-slate-700/50 border-slate-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Display Label</Label>
              <Input
                name="label"
                placeholder="e.g., Investment Amount"
                className="bg-slate-700/50 border-slate-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Data Type</Label>
              <Select name="dataType" required>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="extensible_list">Extensible List</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Category</Label>
              <Select name="category" required>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="preferences">Preferences</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="required" name="required" />
              <Label htmlFor="required" className="text-slate-300">Required by default</Label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddFieldOpen(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Field
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}