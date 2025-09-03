import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, Trash2, Settings, Type, Hash, Mail, Calendar, ToggleLeft, List, FileText, Radio } from 'lucide-react';
import type { FieldLibrary } from '@shared/schema';

interface FieldOption {
  value: string;
  label: string;
}

const FIELD_TYPE_ICONS = {
  'text': Type,
  'email': Mail,
  'number': Hash,
  'date': Calendar,
  'boolean': ToggleLeft,
  'select': List,
  'textarea': FileText,
  'array': List,
  'radio': Radio,
  'extensible_list': Plus,
};

const FIELD_CATEGORIES = [
  'contact',
  'business', 
  'financial',
  'preferences',
  'content',
  'system',
  'custom'
];

export function FieldLibraryManager() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldLibrary | null>(null);
  const [newOptions, setNewOptions] = useState<FieldOption[]>([]);
  const [selectedDataType, setSelectedDataType] = useState<string>('');

  // Fetch field library
  const { data: fieldLibrary = [], isLoading } = useQuery<FieldLibrary[]>({
    queryKey: ["/api/field-library"],
    retry: 1,
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: any) => {
      const response = await fetch('/api/field-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-library'] });
      setIsCreateOpen(false);
      setNewOptions([]);
      toast({ title: 'Field created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating field', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, fieldData }: { id: string; fieldData: any }) => {
      const response = await fetch(`/api/field-library/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      });
      if (!response.ok) throw new Error('Failed to update field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-library'] });
      setEditingField(null);
      setNewOptions([]);
      toast({ title: 'Field updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating field', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete field mutation  
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-library/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-library'] });
      toast({ title: 'Field deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting field', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleCreateField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const fieldData = {
      name: formData.get('name') as string,
      label: formData.get('label') as string,
      category: formData.get('category') as string,
      dataType: formData.get('dataType') as string,
      defaultPlaceholder: formData.get('defaultPlaceholder') as string || null,
      defaultValidation: {
        required: formData.get('required') === 'true',
        minLength: formData.get('minLength') ? parseInt(formData.get('minLength') as string) : undefined,
        maxLength: formData.get('maxLength') ? parseInt(formData.get('maxLength') as string) : undefined,
        min: formData.get('min') ? parseInt(formData.get('min') as string) : undefined,
        max: formData.get('max') ? parseInt(formData.get('max') as string) : undefined,
        pattern: formData.get('pattern') as string || undefined,
        description: formData.get('description') as string || undefined,
        options: newOptions.length > 0 ? newOptions.map(opt => opt.value) : undefined,
        // Extensible list configuration
        itemType: formData.get('itemType') as string || undefined,
        minItems: formData.get('minItems') ? parseInt(formData.get('minItems') as string) : undefined,
        maxItems: formData.get('maxItems') ? parseInt(formData.get('maxItems') as string) : undefined,
        itemLabel: formData.get('itemLabel') as string || undefined,
        itemPlaceholder: formData.get('itemPlaceholder') as string || undefined,
      },
      isSystemField: false
    };

    createFieldMutation.mutate(fieldData);
  };

  const handleUpdateField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingField) return;
    
    const formData = new FormData(e.currentTarget);
    
    const fieldData = {
      // Name cannot be changed
      label: formData.get('label') as string,
      category: formData.get('category') as string,
      defaultPlaceholder: formData.get('defaultPlaceholder') as string || null,
      defaultValidation: {
        ...editingField.defaultValidation,
        required: formData.get('required') === 'true',
        minLength: formData.get('minLength') ? parseInt(formData.get('minLength') as string) : undefined,
        maxLength: formData.get('maxLength') ? parseInt(formData.get('maxLength') as string) : undefined,
        min: formData.get('min') ? parseInt(formData.get('min') as string) : undefined,
        max: formData.get('max') ? parseInt(formData.get('max') as string) : undefined,
        pattern: formData.get('pattern') as string || undefined,
        description: formData.get('description') as string || undefined,
        options: newOptions.length > 0 ? newOptions.map(opt => opt.value) : editingField.defaultValidation?.options,
        // Extensible list configuration
        itemType: formData.get('itemType') as string || editingField.defaultValidation?.itemType,
        minItems: formData.get('minItems') ? parseInt(formData.get('minItems') as string) : editingField.defaultValidation?.minItems,
        maxItems: formData.get('maxItems') ? parseInt(formData.get('maxItems') as string) : editingField.defaultValidation?.maxItems,
        itemLabel: formData.get('itemLabel') as string || editingField.defaultValidation?.itemLabel,
        itemPlaceholder: formData.get('itemPlaceholder') as string || editingField.defaultValidation?.itemPlaceholder,
      },
    };

    updateFieldMutation.mutate({ id: editingField.id, fieldData });
  };

  const addOption = () => {
    setNewOptions([...newOptions, { value: '', label: '' }]);
  };

  const updateOption = (index: number, field: 'value' | 'label', value: string) => {
    const updated = [...newOptions];
    updated[index][field] = value;
    setNewOptions(updated);
  };

  const removeOption = (index: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  const startEdit = (field: FieldLibrary) => {
    setEditingField(field);
    const options = field.defaultValidation?.options || [];
    setNewOptions(options.map((opt: string) => ({ value: opt, label: opt })));
  };

  const groupedFields = fieldLibrary.reduce((acc, field) => {
    const category = field.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {} as Record<string, FieldLibrary[]>);

  if (isLoading) {
    return <div className="p-6 text-center">Loading field library...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Field Library Manager</h2>
          <p className="text-slate-400">Manage your form field library</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-field">
              <Plus className="w-4 h-4 mr-2" />
              Add New Field
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateField} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Field Name (unique identifier)</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., customerPreference"
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-field-name"
                  />
                </div>
                <div>
                  <Label htmlFor="label" className="text-slate-300">Display Label</Label>
                  <Input
                    id="label"
                    name="label"
                    placeholder="e.g., Customer Preference"
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-field-label"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-300">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of this field's purpose"
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="textarea-field-description"
                />
              </div>

              <div>
                <Label htmlFor="defaultPlaceholder" className="text-slate-300">Default Placeholder</Label>
                <Input
                  id="defaultPlaceholder"
                  name="defaultPlaceholder"
                  placeholder="e.g., John, jane@example.com"
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-field-placeholder"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-slate-300">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-field-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataType" className="text-slate-300">Data Type</Label>
                  <Select name="dataType" required onValueChange={setSelectedDataType}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-field-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="array">Multi-select</SelectItem>
                      <SelectItem value="radio">Radio (Single Selection)</SelectItem>
                      <SelectItem value="extensible_list">Extensible List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Options for dropdown/select/radio fields */}
              {(selectedDataType === 'select' || selectedDataType === 'array' || selectedDataType === 'radio') && (
                <div>
                  <Label className="text-slate-300">Field Options</Label>
                  <div className="space-y-2 mt-2">
                    {newOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          className="bg-slate-700/50 border-slate-600"
                        />
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="bg-slate-700/50 border-slate-600"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="border-slate-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="border-slate-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Configuration for extensible list fields */}
              {selectedDataType === 'extensible_list' && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="text-slate-200 font-medium">Extensible List Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemType" className="text-slate-300">Item Type</Label>
                      <Select name="itemType" defaultValue="string">
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="object">Object (Future)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="itemLabel" className="text-slate-300">Item Label</Label>
                      <Input
                        id="itemLabel"
                        name="itemLabel"
                        placeholder="e.g., Unit ID"
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minItems" className="text-slate-300">Minimum Items</Label>
                      <Input
                        id="minItems"
                        name="minItems"
                        type="number"
                        min="0"
                        defaultValue="1"
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxItems" className="text-slate-300">Maximum Items (empty = unlimited)</Label>
                      <Input
                        id="maxItems"
                        name="maxItems"
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itemPlaceholder" className="text-slate-300">Item Placeholder Text</Label>
                    <Input
                      id="itemPlaceholder"
                      name="itemPlaceholder"
                      placeholder="e.g., Enter unit ID..."
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Validation Rules */}
              <Separator />
              <h4 className="text-slate-200 font-medium">Validation Rules</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    name="required"
                    value="true"
                    className="rounded"
                  />
                  <Label htmlFor="required" className="text-slate-300">Required Field</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minLength" className="text-slate-300">Min Length</Label>
                  <Input
                    id="minLength"
                    name="minLength"
                    type="number"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength" className="text-slate-300">Max Length</Label>
                  <Input
                    id="maxLength"
                    name="maxLength"
                    type="number"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pattern" className="text-slate-300">Validation Pattern (regex)</Label>
                <Input
                  id="pattern"
                  name="pattern"
                  placeholder="e.g., ^[A-Za-z0-9]+$"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={createFieldMutation.isPending}
                  data-testid="button-create-field"
                >
                  {createFieldMutation.isPending ? 'Creating...' : 'Create Field'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Field Library */}
      <div className="space-y-6">
        {Object.entries(groupedFields).map(([category, fields]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold text-white mb-4 capitalize">
              {category} Fields ({fields.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => {
                const IconComponent = FIELD_TYPE_ICONS[field.dataType as keyof typeof FIELD_TYPE_ICONS] || Type;
                return (
                  <Card key={field.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-blue-400" />
                          <CardTitle className="text-sm text-white">{field.label}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(field)}
                            className="h-6 w-6 text-slate-400 hover:text-white"
                            data-testid={`button-edit-field-${field.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          {!field.isSystemField && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteFieldMutation.mutate(field.id)}
                              className="h-6 w-6 text-red-400 hover:text-red-300"
                              data-testid={`button-delete-field-${field.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {field.dataType}
                        </Badge>
                        {field.isSystemField && (
                          <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                            System
                          </Badge>
                        )}
                        {field.defaultValidation?.required && (
                          <Badge variant="outline" className="text-xs border-red-600 text-red-400">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Name: <code className="text-blue-400">{field.name}</code>
                      </p>
                      {field.defaultValidation?.description && (
                        <p className="text-xs text-slate-400">{field.defaultValidation.description}</p>
                      )}
                      {field.defaultValidation?.options && field.defaultValidation.options.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Options: {field.defaultValidation.options.join(', ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Field Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Field: {editingField?.label}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <form onSubmit={handleUpdateField} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-slate-300">Field Name (cannot be changed)</Label>
                  <Input
                    id="edit-name"
                    value={editingField.name}
                    disabled
                    className="bg-slate-700/30 border-slate-600 text-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-label" className="text-slate-300">Display Label</Label>
                  <Input
                    id="edit-label"
                    name="label"
                    defaultValue={editingField.label}
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-edit-field-label"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingField.defaultValidation?.description || ''}
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="textarea-edit-field-description"
                />
              </div>

              <div>
                <Label htmlFor="edit-placeholder" className="text-slate-300">Default Placeholder</Label>
                <Input
                  id="edit-placeholder"
                  name="defaultPlaceholder"
                  defaultValue={editingField.defaultPlaceholder || ''}
                  placeholder="e.g., John, jane@example.com"
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-edit-field-placeholder"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="text-slate-300">Category</Label>
                  <Select name="category" defaultValue={editingField.category || 'custom'}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-dataType" className="text-slate-300">Data Type (cannot be changed)</Label>
                  <Input
                    value={editingField.dataType}
                    disabled
                    className="bg-slate-700/30 border-slate-600 text-slate-500"
                  />
                </div>
              </div>

              {/* Options for dropdown/select/radio fields */}
              {(editingField.dataType === 'select' || editingField.dataType === 'array' || editingField.dataType === 'radio') && (
                <div>
                  <Label className="text-slate-300">Dropdown Options</Label>
                  <div className="space-y-2 mt-2">
                    {newOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          className="bg-slate-700/50 border-slate-600"
                        />
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="bg-slate-700/50 border-slate-600"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="border-slate-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="border-slate-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Configuration for extensible list fields */}
              {editingField.dataType === 'extensible_list' && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="text-slate-200 font-medium">Extensible List Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-itemType" className="text-slate-300">Item Type</Label>
                      <Select name="itemType" defaultValue={editingField.defaultValidation?.itemType || "string"}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="object">Object (Future)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-itemLabel" className="text-slate-300">Item Label</Label>
                      <Input
                        id="edit-itemLabel"
                        name="itemLabel"
                        placeholder="e.g., Unit ID"
                        defaultValue={editingField.defaultValidation?.itemLabel}
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-minItems" className="text-slate-300">Minimum Items</Label>
                      <Input
                        id="edit-minItems"
                        name="minItems"
                        type="number"
                        min="0"
                        defaultValue={editingField.defaultValidation?.minItems || 1}
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-maxItems" className="text-slate-300">Maximum Items (empty = unlimited)</Label>
                      <Input
                        id="edit-maxItems"
                        name="maxItems"
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        defaultValue={editingField.defaultValidation?.maxItems}
                        className="bg-slate-700/50 border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-itemPlaceholder" className="text-slate-300">Item Placeholder Text</Label>
                    <Input
                      id="edit-itemPlaceholder"
                      name="itemPlaceholder"
                      placeholder="e.g., Enter unit ID..."
                      defaultValue={editingField.defaultValidation?.itemPlaceholder}
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Validation Rules */}
              <Separator />
              <h4 className="text-slate-200 font-medium">Validation Rules</h4>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-required"
                  name="required"
                  value="true"
                  defaultChecked={editingField.defaultValidation?.required}
                  className="rounded"
                />
                <Label htmlFor="edit-required" className="text-slate-300">Required Field</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-minLength" className="text-slate-300">Min Length</Label>
                  <Input
                    id="edit-minLength"
                    name="minLength"
                    type="number"
                    defaultValue={editingField.defaultValidation?.minLength}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxLength" className="text-slate-300">Max Length</Label>
                  <Input
                    id="edit-maxLength"
                    name="maxLength"
                    type="number"
                    defaultValue={editingField.defaultValidation?.maxLength}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-pattern" className="text-slate-300">Validation Pattern (regex)</Label>
                <Input
                  id="edit-pattern"
                  name="pattern"
                  defaultValue={editingField.defaultValidation?.pattern}
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingField(null)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateFieldMutation.isPending}
                  data-testid="button-update-field"
                >
                  {updateFieldMutation.isPending ? 'Updating...' : 'Update Field'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}