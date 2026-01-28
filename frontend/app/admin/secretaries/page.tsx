'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { adminService, CreateUserRequest, CreateSecretaryRequest } from '@/services';
import { User, Doctor } from '@/types';

interface Secretary {
  id: string;
  userId: string;
  user: User;
  doctors: Doctor[];
}

// Form for creating new secretary (creates user + secretary profile)
interface NewSecretaryForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export default function AdminSecretariesPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSecretary, setSelectedSecretary] = useState<Secretary | null>(null);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<NewSecretaryForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [secretariesData, doctorsData] = await Promise.all([
        adminService.getSecretaries(),
        adminService.getAllDoctors(),
      ]);
      setSecretaries(secretariesData);
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load secretaries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Create user with Secretary role
      const userRequest: CreateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: 'secretary' as any,
      };
      const newUser = await adminService.createUser(userRequest);

      // Step 2: Create secretary profile with the user's ID
      const secretaryRequest: CreateSecretaryRequest = {
        userId: newUser.id,
      };
      const newSecretary = await adminService.createSecretary(secretaryRequest);
      
      // Reload data to get proper secretary structure
      await loadData();
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to create secretary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secretary?')) return;

    try {
      await adminService.deleteUser(id);
      setSecretaries(secretaries.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete secretary:', err);
      setError('Failed to delete secretary');
    }
  };

  const openAssignModal = async (secretary: Secretary) => {
    setSelectedSecretary(secretary);
    
    // Use doctors already loaded from the secretary object
    setSelectedDoctorIds(secretary.doctors?.map(d => d.id) || []);
    
    setShowAssignModal(true);
  };

  const handleAssignDoctors = async () => {
    if (!selectedSecretary) return;
    setIsSubmitting(true);
    setError('');

    try {
      // Get current assignments
      const currentDoctorIds: string[] = await adminService.getSecretaryDoctors(selectedSecretary.id)
        .then(doctors => doctors.map(d => d.id))
        .catch(() => []);
      
      // Find doctors to add (in selectedDoctorIds but not in currentDoctorIds)
      const doctorsToAdd = selectedDoctorIds.filter(id => !currentDoctorIds.includes(id));
      
      // Find doctors to remove (in currentDoctorIds but not in selectedDoctorIds)
      const doctorsToRemove = currentDoctorIds.filter(id => !selectedDoctorIds.includes(id));
      
      // Add new doctors
      for (const doctorId of doctorsToAdd) {
        await adminService.assignDoctorToSecretary(selectedSecretary.id, doctorId);
      }
      
      // Remove unselected doctors
      for (const doctorId of doctorsToRemove) {
        await adminService.unassignDoctorFromSecretary(selectedSecretary.id, doctorId);
      }
      
      // Reload to get updated assignments
      await loadData();
      
      console.log('Data reloaded');
      
      setShowAssignModal(false);
      setSelectedSecretary(null);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to update doctor assignments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctorIds(prev => 
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    });
  };

  const getDoctorName = (doctor: Doctor) => {
    return doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unknown';
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
          <h2 className="text-2xl font-bold">Secretaries Management</h2>
          <p className="text-muted-foreground">Manage secretaries and their doctor assignments</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <span className="mr-2">+</span> Add Secretary
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-left p-4 font-medium">Assigned Doctors</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {secretaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No secretaries found. Click &quot;Add Secretary&quot; to create one.
                  </td>
                </tr>
              ) : (
                secretaries.map((secretary) => (
                  <tr key={secretary.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
                          {secretary.user.firstName?.[0]}{secretary.user.lastName?.[0]}
                        </div>
                        <span>{secretary.user.firstName} {secretary.user.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4">{secretary.user.email}</td>
                    <td className="p-4">{secretary.user.phone || '-'}</td>
                    <td className="p-4">
                      {secretary.doctors && secretary.doctors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {secretary.doctors.slice(0, 3).map((doctor) => (
                            <span
                              key={doctor.id}
                              className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                            >
                              Dr. {getDoctorName(doctor).split(' ')[0]}
                            </span>
                          ))}
                          {secretary.doctors.length > 3 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              +{secretary.doctors.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None assigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignModal(secretary)}
                        >
                          Assign Doctors
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(secretary.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Secretary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Secretary</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Secretary'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Assign Doctors Modal */}
      {showAssignModal && selectedSecretary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>
                Assign Doctors to {selectedSecretary.user.firstName} {selectedSecretary.user.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              {doctors.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No doctors available to assign.
                </p>
              ) : (
                <div className="space-y-2">
                  {doctors.map((doctor) => (
                    <label
                      key={doctor.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDoctorIds.includes(doctor.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDoctorIds.includes(doctor.id)}
                        onChange={() => toggleDoctorSelection(doctor.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedDoctorIds.includes(doctor.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}>
                        {selectedDoctorIds.includes(doctor.id) && '✓'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Dr. {getDoctorName(doctor)}</p>
                        <p className="text-sm text-muted-foreground">
                          {doctor.specialization?.name || 'No specialization'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="flex justify-between items-center p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                {selectedDoctorIds.length} doctor(s) selected
              </p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedSecretary(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignDoctors} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Assignments'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
