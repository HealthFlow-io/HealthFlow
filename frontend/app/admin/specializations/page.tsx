'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { adminService, CreateSpecializationRequest } from '@/services';
import { Specialization } from '@/types';

// Category options for specializations
const CATEGORIES = [
  'Primary Care',
  'Surgery',
  'Internal Medicine',
  'Pediatrics',
  'Mental Health',
  'Diagnostic',
  'Dental',
  'Emergency',
  'Women\'s Health',
  'Other',
];

export default function AdminSpecializationsPage() {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specialization | null>(null);
  const [formData, setFormData] = useState<CreateSpecializationRequest>({
    name: '',
    category: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAllSpecializations();
      setSpecializations(data);
    } catch (err) {
      console.error('Failed to load specializations:', err);
      setError('Failed to load specializations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const request: CreateSpecializationRequest = {
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
      };

      if (editingSpec) {
        const updated = await adminService.updateSpecialization(editingSpec.id, request);
        setSpecializations(specializations.map(s => s.id === editingSpec.id ? updated : s));
      } else {
        const newSpec = await adminService.createSpecialization(request);
        setSpecializations([...specializations, newSpec]);
      }
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialization?')) return;

    try {
      await adminService.deleteSpecialization(id);
      setSpecializations(specializations.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete specialization:', err);
      setError('Failed to delete specialization');
    }
  };

  const openModal = (spec?: Specialization) => {
    if (spec) {
      setEditingSpec(spec);
      setFormData({
        name: spec.name,
        category: spec.category || '',
        description: spec.description || '',
      });
    } else {
      setEditingSpec(null);
      setFormData({
        name: '',
        category: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSpec(null);
  };

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Primary Care': '🩺',
      'Surgery': '🔪',
      'Internal Medicine': '💊',
      'Pediatrics': '👶',
      'Mental Health': '🧠',
      'Diagnostic': '🔬',
      'Dental': '🦷',
      'Emergency': '🚑',
      'Women\'s Health': '🤰',
      'Other': '⚕️',
    };
    return icons[category] || '⚕️';
  };

  // Group specializations by category
  const groupedSpecs = specializations.reduce((acc, spec) => {
    const category = spec.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(spec);
    return acc;
  }, {} as Record<string, Specialization[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Specializations Management</h2>
          <p className="text-muted-foreground">Manage medical specializations and categories</p>
        </div>
        <Button onClick={() => openModal()}>
          <span className="mr-2">+</span> Add Specialization
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {specializations.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg">
          No specializations found. Click &quot;Add Specialization&quot; to create one.
        </div>
      ) : (
        Object.entries(groupedSpecs).map(([category, specs]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span>{getCategoryIcon(category)}</span>
              {category}
              <span className="text-sm text-muted-foreground font-normal">({specs.length})</span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {specs.map((spec) => (
                <Card key={spec.id} className="relative group">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{spec.name}</h4>
                        {spec.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {spec.description}
                          </p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => openModal(spec)}
                          className="p-1 text-muted-foreground hover:text-primary"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(spec.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingSpec ? 'Edit Specialization' : 'Add New Specialization'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cardiology"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryIcon(cat)} {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this specialization..."
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingSpec ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
