'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { adminService, secretaryService, AppointmentHistory } from '@/services';
import { Doctor } from '@/types';

export default function SecretaryDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

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

  const loadDoctorAppointments = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setLoadingAppointments(true);
    setError('');
    try {
      console.log('Loading appointments for doctor:', doctor.id);
      const history = await secretaryService.getDoctorAppointments(doctor.id);
      console.log('Loaded appointments:', history);
      setAppointments(history);
      if (history.length === 0) {
        console.warn('No appointments found for doctor');
      }
    } catch (err: unknown) {
      console.error('Failed to load appointments:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load appointment history';
      setError(errorMessage);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const closeAppointmentView = () => {
    setSelectedDoctor(null);
    setAppointments([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show appointment history view
  if (selectedDoctor) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">
              Appointment History - Dr. {selectedDoctor.fullName || `${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
            </h2>
            <p className="text-muted-foreground">
              {selectedDoctor.specialization?.name || 'General Medicine'}
            </p>
          </div>
          <Button onClick={closeAppointmentView} variant="outline">
            ← Back to Doctors
          </Button>
        </div>

        {loadingAppointments ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">⚠️</span>
              <p className="text-lg font-medium text-destructive">{error}</p>
              <Button onClick={() => loadDoctorAppointments(selectedDoctor)} className="mt-4" variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">📅</span>
              <p className="text-lg font-medium">No appointments found</p>
              <p className="text-muted-foreground">
                This doctor has no appointment history yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
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
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    onViewHistory={() => loadDoctorAppointments(doctor)}
                  />
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
  onViewHistory: () => void;
}

function DoctorCard({ doctor, onViewHistory }: DoctorCardProps) {
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
        <Button 
          onClick={onViewHistory} 
          className="w-full mt-4"
          variant="outline"
        >
          📅 View Appointment History
        </Button>
      </CardContent>
    </Card>
  );
}

interface AppointmentCardProps {
  appointment: AppointmentHistory;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'declined':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'done':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💼</span>
            <Badge variant="outline">{appointment.type}</Badge>
          </div>
          {appointment.patient.phone && (
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>{appointment.patient.phone}</span>
            </div>
          )}
          {appointment.reason && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t">
              <span>📝</span>
              <span className="flex-1">{appointment.reason}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
