'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store';
import { doctorService, specializationService } from '@/services';
import { Doctor, Specialization } from '@/types';

interface DoctorProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  licenseNumber: string;
  yearsOfExperience: number;
  consultationFee: number;
  languages: string[];
  education: string;
  specializations: string[];
}

export default function DoctorProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<DoctorProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    consultationFee: 0,
    languages: [],
    education: '',
    specializations: [],
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const [doctorData, specsData] = await Promise.all([
        doctorService.getById(user!.id),
        specializationService.getAll(),
      ]);
      setDoctor(doctorData);
      setSpecializations(specsData);
      setFormData({
        firstName: doctorData.firstName || user?.firstName || '',
        lastName: doctorData.lastName || user?.lastName || '',
        email: doctorData.email || user?.email || '',
        phone: doctorData.phone || '',
        bio: doctorData.bio || '',
        licenseNumber: doctorData.licenseNumber || '',
        yearsOfExperience: doctorData.yearsOfExperience || 0,
        consultationFee: doctorData.consultationFee || 0,
        languages: doctorData.languages || [],
        education: doctorData.education || '',
        specializations: doctorData.specializationId ? [doctorData.specializationId] : [],
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Use user data if doctor profile not found
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: '',
        licenseNumber: '',
        yearsOfExperience: 0,
        consultationFee: 0,
        languages: [],
        education: '',
        specializations: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // DoctorUpdateDto only includes doctor profile fields, not user fields
      await doctorService.update(user!.id, {
        fullName: `${formData.firstName} ${formData.lastName}`,
        bio: formData.bio || undefined,
        experienceYears: formData.yearsOfExperience,
        consultationPrice: formData.consultationFee,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        specializationId: formData.specializations[0] || undefined,
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const commonLanguages = ['English', 'French', 'Arabic', 'Spanish', 'German', 'Chinese', 'Hindi'];

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground">Manage your professional information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md">
          {success}
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
              {formData.firstName[0]}{formData.lastName[0]}
            </div>
            <div>
              <CardTitle className="text-xl">
                Dr. {formData.firstName} {formData.lastName}
              </CardTitle>
              <p className="text-muted-foreground">
                {doctor?.specialization?.name || 'General Practitioner'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {doctor?.rating && (
                  <span className="flex items-center gap-1">
                    ⭐ {doctor.rating.toFixed(1)}
                  </span>
                )}
                {doctor?.reviewCount && (
                  <span>({doctor.reviewCount} reviews)</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Specialization</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                value={formData.specializations[0] || ''}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value ? [e.target.value] : [] })}
                disabled={!isEditing}
              >
                <option value="">Select specialization</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">License Number</label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Experience</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Education</label>
              <Input
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., MD from Harvard Medical School"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Consultation Fee ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md bg-background resize-none disabled:opacity-50"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell patients about yourself, your experience, and approach to care..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Languages Spoken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {commonLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => isEditing && toggleLanguage(language)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    formData.languages.includes(language)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                  disabled={!isEditing}
                >
                  {language}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => {
              setIsEditing(false);
              loadProfile();
            }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
