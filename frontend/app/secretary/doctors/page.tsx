'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { adminService } from '@/services';
import { Doctor } from '@/types';

export default function SecretaryDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = doctors.filter((doctor) =>
        `${doctor.fullName || doctor.firstName + ' ' + doctor.lastName} ${doctor.specialization?.name || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchTerm, doctors]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const secretaryProfile = await adminService.getMySecretaryProfile();
      const assignedDoctors = secretaryProfile.doctors || [];
      
      setDoctors(assignedDoctors);
      setFilteredDoctors(assignedDoctors);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Failed to load assigned doctors');
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-3xl font-bold">Assigned Doctors</h2>
          <p className="text-muted-foreground">
            Doctors under your management
          </p>
        </div>
        <div className="text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">{doctors.length}</span> Doctors
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {doctors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-4 block">👨‍⚕️</span>
            <p className="text-lg font-medium">No doctors assigned</p>
            <p className="text-muted-foreground">
              Contact your administrator to assign doctors to your account
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <Input
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Doctors List */}
          <div className="space-y-4">
            {filteredDoctors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <span className="text-4xl mb-4 block">🔍</span>
                  <p className="text-lg font-medium">No doctors found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const doctorName = doctor.fullName || `${doctor.firstName} ${doctor.lastName}`;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">Dr. {doctorName}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {doctor.specialization?.name || 'General Medicine'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {doctor.user?.email && (
            <div className="flex items-center gap-2">
              <span>📧</span>
              <span className="truncate">{doctor.user.email}</span>
            </div>
          )}
          {doctor.user?.phone && (
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>{doctor.user.phone}</span>
            </div>
          )}
          {doctor.experienceYears !== undefined && (
            <div className="flex items-center gap-2">
              <span>⏱️</span>
              <span>{doctor.experienceYears} years experience</span>
            </div>
          )}
          {doctor.consultationPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>${doctor.consultationPrice} per consultation</span>
            </div>
          )}
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="flex items-start gap-2">
              <span>🗣️</span>
              <span className="flex-1">{doctor.languages.join(', ')}</span>
            </div>
          )}
          {doctor.rating && (
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>{doctor.rating.toFixed(1)} rating</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
