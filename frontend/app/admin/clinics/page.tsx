'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { adminService, CreateClinicRequest } from '@/services';
import { Clinic, DayOfWeek, WorkingHours, ContactInfo } from '@/types';

// Form state for clinic
interface ClinicForm {
  name: string;
  address: string;
  // ContactInfo fields
  phone: string;
  email: string;
  website: string;
  // GeoLocation fields (optional)
  latitude: string;
  longitude: string;
  // Working hours simplified for UI
  openTime: string;
  closeTime: string;
  closedDays: number[]; // Days when closed
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState<ClinicForm>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    latitude: '',
    longitude: '',
    openTime: '08:00',
    closeTime: '18:00',
    closedDays: [0], // Sunday closed by default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAllClinics();
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setClinics(data);
      } else if (data && typeof data === 'object' && 'data' in data) {
        setClinics((data as { data: Clinic[] }).data || []);
      } else {
        setClinics([]);
      }
    } catch (err) {
      console.error('Failed to load clinics:', err);
      setError('Failed to load clinics');
    } finally {
      setIsLoading(false);
    }
  };

  // Build working hours array from form
  const buildWorkingHours = (): WorkingHours[] => {
    return DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value as DayOfWeek,
      openTime: formData.openTime,
      closeTime: formData.closeTime,
      isClosed: formData.closedDays.includes(day.value),
    }));
  };

  // Build request DTO from form
  const buildRequest = (): CreateClinicRequest => {
    const request: CreateClinicRequest = {
      name: formData.name,
      address: formData.address,
    };

    // Add contact info if any field is filled
    if (formData.phone || formData.email || formData.website) {
      request.contactInfo = {
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
      };
    }

    // Add geo location if both fields are filled
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        request.geoLocation = { latitude: lat, longitude: lng };
      }
    }

    // Add working hours
    request.workingHours = buildWorkingHours();

    return request;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const request = buildRequest();
      
      if (editingClinic) {
        const updated = await adminService.updateClinic(editingClinic.id, request);
        setClinics(clinics.map(c => c.id === editingClinic.id ? updated : c));
      } else {
        const newClinic = await adminService.createClinic(request);
        setClinics([...clinics, newClinic]);
      }
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save clinic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinic?')) return;

    try {
      await adminService.deleteClinic(id);
      setClinics(clinics.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete clinic:', err);
      setError('Failed to delete clinic');
    }
  };

  const toggleClosedDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter(d => d !== day)
        : [...prev.closedDays, day]
    }));
  };

  const openModal = (clinic?: Clinic) => {
    if (clinic) {
      setEditingClinic(clinic);
      
      // Extract working hours
      const workingHours = clinic.workingHours || [];
      
      let openTime = '08:00';
      let closeTime = '18:00';
      let closedDays: number[] = [];
      
      if (workingHours.length > 0) {
        const firstOpen = workingHours.find(wh => !wh.isClosed);
        if (firstOpen) {
          openTime = firstOpen.openTime || '08:00';
          closeTime = firstOpen.closeTime || '18:00';
        }
        closedDays = workingHours.filter(wh => wh.isClosed).map(wh => wh.dayOfWeek);
      } else if (clinic.openingTime && clinic.closingTime) {
        // Fallback to old format
        openTime = clinic.openingTime;
        closeTime = clinic.closingTime;
        closedDays = [0]; // Sunday closed by default
      } else {
        // No hours set, default to Sunday closed
        closedDays = [0];
      }
      
      setFormData({
        name: clinic.name,
        address: clinic.address || '',
        phone: clinic.contactInfo?.phone || clinic.phone || '',
        email: clinic.contactInfo?.email || clinic.email || '',
        website: clinic.contactInfo?.website || '',
        latitude: clinic.geoLocation?.latitude?.toString() || '',
        longitude: clinic.geoLocation?.longitude?.toString() || '',
        openTime,
        closeTime,
        closedDays,
      });
    } else {
      setEditingClinic(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        latitude: '',
        longitude: '',
        openTime: '08:00',
        closeTime: '18:00',
        closedDays: [0],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClinic(null);
  };

  // Get display values for clinic card
  const getClinicPhone = (clinic: Clinic) => clinic.contactInfo?.phone || clinic.phone || '-';
  const getClinicEmail = (clinic: Clinic) => clinic.contactInfo?.email || clinic.email || '-';
  const getClinicHours = (clinic: Clinic) => {
    if (clinic.workingHours && clinic.workingHours.length > 0) {
      const open = clinic.workingHours.find(wh => !wh.isClosed);
      if (open && open.openTime && open.closeTime) {
        return `${open.openTime} - ${open.closeTime}`;
      }
    }
    if (clinic.openingTime && clinic.closingTime) {
      return `${clinic.openingTime} - ${clinic.closingTime}`;
    }
    return 'Not set';
  };

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
          <h2 className="text-2xl font-bold">Clinics Management</h2>
          <p className="text-muted-foreground">Manage clinic locations and information</p>
        </div>
        <Button onClick={() => openModal()}>
          <span className="mr-2">+</span> Add Clinic
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clinics.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No clinics found. Click &quot;Add Clinic&quot; to create one.
          </div>
        ) : (
          clinics.map((clinic) => (
            <Card key={clinic.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    🏥
                  </div>
                  <div>
                    <CardTitle className="text-lg">{clinic.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {clinic.address || 'No address'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{getClinicPhone(clinic)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate max-w-[150px]">{getClinicEmail(clinic)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Hours:</span>
                    <span>{getClinicHours(clinic)}</span>
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openModal(clinic)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(clinic.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>{editingClinic ? 'Edit Clinic' : 'Add New Clinic'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clinic Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address *</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <h3 className="font-medium text-sm text-muted-foreground pt-2">Contact Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <h3 className="font-medium text-sm text-muted-foreground pt-2">Location (Optional)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g., 40.7128"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g., -74.0060"
                    />
                  </div>
                </div>

                <h3 className="font-medium text-sm text-muted-foreground pt-2">Working Hours</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opening Time</label>
                    <Input
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Closing Time</label>
                    <Input
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Closed Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleClosedDay(day.value)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          formData.closedDays.includes(day.value)
                            ? 'bg-destructive text-destructive-foreground border-destructive'
                            : 'bg-background border-muted-foreground/30 hover:border-primary'
                        }`}
                      >
                        {day.label.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Click days to toggle closed status</p>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingClinic ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
