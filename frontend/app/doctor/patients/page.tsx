'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService, doctorService } from '@/services';
import { Appointment } from '@/types';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  appointmentCount: number;
  lastAppointment?: string;
}

export default function DoctorPatientsPage() {
  const user = useAuthStore((state) => state.user);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter((patient) =>
        `${patient.firstName} ${patient.lastName} ${patient.email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const loadDoctorProfile = async () => {
    try {
      const doctor = await doctorService.getMyProfile();
      setDoctorId(doctor.id);
      await loadPatients(doctor.id);
    } catch (err) {
      console.error('Failed to load doctor profile:', err);
      setError('Failed to load doctor profile');
      setIsLoading(false);
    }
  };

  const loadPatients = async (docId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await appointmentService.getByDoctor(docId);
      const appointments = response.data || response as unknown as Appointment[];

      // Extract unique patients from appointments
      const patientMap = new Map<string, Patient>();
      
      appointments.forEach((apt) => {
        if (apt.patient) {
          const patientId = apt.patient.id || apt.patientId;
          if (patientId) {
            if (!patientMap.has(patientId)) {
              patientMap.set(patientId, {
                id: patientId,
                firstName: apt.patient.firstName || '',
                lastName: apt.patient.lastName || '',
                email: apt.patient.email || '',
                phone: apt.patient.phone,
                appointmentCount: 1,
                lastAppointment: apt.date,
              });
            } else {
              const existing = patientMap.get(patientId)!;
              existing.appointmentCount++;
              // Update last appointment if this one is more recent
              if (apt.date && (!existing.lastAppointment || apt.date > existing.lastAppointment)) {
                existing.lastAppointment = apt.date;
              }
            }
          }
        }
      });

      const patientsList = Array.from(patientMap.values()).sort((a, b) => {
        const dateA = a.lastAppointment || '';
        const dateB = b.lastAppointment || '';
        return dateB.localeCompare(dateA); // Most recent first
      });

      setPatients(patientsList);
      setFilteredPatients(patientsList);
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Failed to load patients');
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
          <h2 className="text-3xl font-bold">My Patients</h2>
          <p className="text-muted-foreground">
            View all patients you&apos;ve consulted with
          </p>
        </div>
        <div className="text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">{patients.length}</span> Total Patients
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'You don\'t have any patients yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PatientCardProps {
  patient: Patient;
}

function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {patient.firstName} {patient.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {patient.phone && (
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>{patient.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>
              {patient.appointmentCount}{' '}
              {patient.appointmentCount === 1 ? 'appointment' : 'appointments'}
            </span>
          </div>
          {patient.lastAppointment && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>🕐</span>
              <span>Last visit: {formatDate(patient.lastAppointment)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
