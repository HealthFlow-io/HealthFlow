'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { adminService, CreateDoctorRequest, UpdateDoctorRequest, CreateUserRequest, specializationService, clinicService } from '@/services';
import { Doctor, Specialization, Clinic, ConsultationType, UserRole } from '@/types';

// Form for creating new doctor (first create user, then create doctor profile)
interface NewDoctorForm {
  // User fields
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  // Doctor profile fields
  specializationId: string;
  subSpecializations: string[];
  bio: string;
  experienceYears: number;
  languages: string[];
  consultationTypes: ConsultationType[];
  consultationDuration: number;
  consultationPrice: number;
  clinicId: string;
}

// Form for editing existing doctor profile
interface EditDoctorForm {
  fullName: string;
  specializationId: string;
  subSpecializations: string[];
  bio: string;
  experienceYears: number;
  languages: string[];
  consultationTypes: ConsultationType[];
  consultationDuration: number;
  consultationPrice: number;
  clinicId: string;
}

const CONSULTATION_TYPE_OPTIONS: { value: ConsultationType; label: string }[] = [
  { value: ConsultationType.Physical, label: 'Physical' },
  { value: ConsultationType.Online, label: 'Online' },
  { value: ConsultationType.HomeVisit, label: 'Home Visit' },
];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  // Form for new doctor (includes user creation)
  const [newForm, setNewForm] = useState<NewDoctorForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specializationId: '',
    subSpecializations: [],
    bio: '',
    experienceYears: 0,
    languages: [],
    consultationTypes: [ConsultationType.Physical],
    consultationDuration: 30,
    consultationPrice: 0,
    clinicId: '',
  });

  // Form for editing existing doctor
  const [editForm, setEditForm] = useState<EditDoctorForm>({
    fullName: '',
    specializationId: '',
    subSpecializations: [],
    bio: '',
    experienceYears: 0,
    languages: [],
    consultationTypes: [ConsultationType.Physical],
    consultationDuration: 30,
    consultationPrice: 0,
    clinicId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [doctorsData, specsData, clinicsData] = await Promise.all([
        adminService.getAllDoctors(),
        specializationService.getAll(),
        clinicService.getAll(),
      ]);
      setDoctors(doctorsData);
      setSpecializations(specsData);
      // Handle paginated or array response
      setClinics(Array.isArray(clinicsData) ? clinicsData : (clinicsData.data || []));
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Create user with Doctor role
      const userRequest: CreateUserRequest = {
        firstName: newForm.firstName,
        lastName: newForm.lastName,
        email: newForm.email,
        password: newForm.password,
        phone: newForm.phone || undefined,
        role: UserRole.Doctor,
      };
      const newUser = await adminService.createUser(userRequest);

      // Step 2: Create doctor profile with the new user's ID
      const doctorRequest: CreateDoctorRequest = {
        userId: newUser.id,
        fullName: `${newForm.firstName} ${newForm.lastName}`,
        specializationId: newForm.specializationId,
        subSpecializations: newForm.subSpecializations.length > 0 ? newForm.subSpecializations : undefined,
        bio: newForm.bio || undefined,
        experienceYears: newForm.experienceYears,
        languages: newForm.languages.length > 0 ? newForm.languages : undefined,
        consultationTypes: newForm.consultationTypes,
        consultationDuration: newForm.consultationDuration,
        consultationPrice: newForm.consultationPrice,
        clinicId: newForm.clinicId || undefined,
      };
      const newDoctor = await adminService.createDoctor(doctorRequest);
      setDoctors([...doctors, newDoctor]);
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to create doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setIsSubmitting(true);
    setError('');

    try {
      const updateRequest: UpdateDoctorRequest = {
        fullName: editForm.fullName || undefined,
        specializationId: editForm.specializationId || undefined,
        subSpecializations: editForm.subSpecializations.length > 0 ? editForm.subSpecializations : undefined,
        bio: editForm.bio || undefined,
        experienceYears: editForm.experienceYears,
        languages: editForm.languages.length > 0 ? editForm.languages : undefined,
        consultationTypes: editForm.consultationTypes.length > 0 ? editForm.consultationTypes : undefined,
        consultationDuration: editForm.consultationDuration || undefined,
        consultationPrice: editForm.consultationPrice || undefined,
        clinicId: editForm.clinicId || undefined,
      };
      const updated = await adminService.updateDoctor(editingDoctor.id, updateRequest);
      setDoctors(doctors.map(d => d.id === editingDoctor.id ? updated : d));
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to update doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      await adminService.deleteDoctor(id);
      setDoctors(doctors.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete doctor:', err);
      setError('Failed to delete doctor');
    }
  };

  const openCreateModal = () => {
    setEditingDoctor(null);
    setNewForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      specializationId: '',
      subSpecializations: [],
      bio: '',
      experienceYears: 0,
      languages: [],
      consultationTypes: [ConsultationType.Physical],
      consultationDuration: 30,
      consultationPrice: 0,
      clinicId: '',
    });
    setShowModal(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      fullName: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
      specializationId: doctor.specializationId || '',
      subSpecializations: doctor.subSpecializations || [],
      bio: doctor.bio || '',
      experienceYears: doctor.experienceYears || doctor.yearsOfExperience || 0,
      languages: doctor.languages || [],
      consultationTypes: doctor.consultationTypes || [ConsultationType.Physical],
      consultationDuration: doctor.consultationDuration || 30,
      consultationPrice: doctor.consultationPrice || doctor.consultationFee || 0,
      clinicId: doctor.clinicId || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
  };

  const toggleConsultationType = (type: ConsultationType, isNew: boolean) => {
    if (isNew) {
      setNewForm(prev => ({
        ...prev,
        consultationTypes: prev.consultationTypes.includes(type)
          ? prev.consultationTypes.filter(t => t !== type)
          : [...prev.consultationTypes, type]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        consultationTypes: prev.consultationTypes.includes(type)
          ? prev.consultationTypes.filter(t => t !== type)
          : [...prev.consultationTypes, type]
      }));
    }
  };

  const getDoctorName = (doctor: Doctor) => {
    return doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unknown';
  };

  const getDoctorInitials = (doctor: Doctor) => {
    const name = getDoctorName(doctor);
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
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
          <h2 className="text-2xl font-bold">Doctors Management</h2>
          <p className="text-muted-foreground">Manage all doctors and their information</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="mr-2">+</span> Add Doctor
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No doctors found. Click &quot;Add Doctor&quot; to create one.
          </div>
        ) : (
          doctors.map((doctor) => (
            <Card key={doctor.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-lg uppercase">
                    {getDoctorInitials(doctor)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Dr. {getDoctorName(doctor)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialization?.name || 'No specialization'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{doctor.email || doctor.user?.email || '-'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{doctor.phone || doctor.user?.phone || '-'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span>{doctor.experienceYears || doctor.yearsOfExperience || 0} years</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span>${doctor.consultationPrice || doctor.consultationFee || 0}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{doctor.consultationDuration || 30} min</span>
                  </p>
                  {doctor.consultationTypes && doctor.consultationTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {doctor.consultationTypes.map(type => (
                        <span key={type} className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {doctor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{doctor.bio}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(doctor)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doctor.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</CardTitle>
            </CardHeader>
            <form onSubmit={editingDoctor ? handleUpdateDoctor : handleCreateDoctor}>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* New Doctor: User fields */}
                {!editingDoctor && (
                  <>
                    <h3 className="font-medium text-sm text-muted-foreground">User Account</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name *</label>
                        <Input
                          value={newForm.firstName}
                          onChange={(e) => setNewForm({ ...newForm, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name *</label>
                        <Input
                          value={newForm.lastName}
                          onChange={(e) => setNewForm({ ...newForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={newForm.email}
                        onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password *</label>
                      <Input
                        type="password"
                        value={newForm.password}
                        onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        type="tel"
                        value={newForm.phone}
                        onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                      />
                    </div>
                    <hr className="my-4" />
                    <h3 className="font-medium text-sm text-muted-foreground">Doctor Profile</h3>
                  </>
                )}

                {/* Edit Doctor: Full Name */}
                {editingDoctor && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Common fields */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialization *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={editingDoctor ? editForm.specializationId : newForm.specializationId}
                    onChange={(e) => editingDoctor 
                      ? setEditForm({ ...editForm, specializationId: e.target.value })
                      : setNewForm({ ...newForm, specializationId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Clinic (Optional)</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={editingDoctor ? editForm.clinicId : newForm.clinicId}
                    onChange={(e) => editingDoctor 
                      ? setEditForm({ ...editForm, clinicId: e.target.value })
                      : setNewForm({ ...newForm, clinicId: e.target.value })
                    }
                  >
                    <option value="">No clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience (Years)</label>
                    <Input
                      type="number"
                      min="0"
                      value={editingDoctor ? editForm.experienceYears : newForm.experienceYears}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        editingDoctor 
                          ? setEditForm({ ...editForm, experienceYears: value })
                          : setNewForm({ ...newForm, experienceYears: value });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDoctor ? editForm.consultationPrice : newForm.consultationPrice}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        editingDoctor 
                          ? setEditForm({ ...editForm, consultationPrice: value })
                          : setNewForm({ ...newForm, consultationPrice: value });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation Duration (minutes) *</label>
                  <Input
                    type="number"
                    min="15"
                    step="5"
                    value={editingDoctor ? editForm.consultationDuration : newForm.consultationDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30;
                      editingDoctor 
                        ? setEditForm({ ...editForm, consultationDuration: value })
                        : setNewForm({ ...newForm, consultationDuration: value });
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation Types *</label>
                  <div className="flex flex-wrap gap-2">
                    {CONSULTATION_TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleConsultationType(value, !editingDoctor)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          (editingDoctor ? editForm : newForm).consultationTypes.includes(value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-muted-foreground/30 hover:border-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                    rows={3}
                    value={editingDoctor ? editForm.bio : newForm.bio}
                    onChange={(e) => editingDoctor 
                      ? setEditForm({ ...editForm, bio: e.target.value })
                      : setNewForm({ ...newForm, bio: e.target.value })
                    }
                    placeholder="Brief description about the doctor..."
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingDoctor ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
