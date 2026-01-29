'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { secretaryService, SecretaryPatient, AppointmentHistory } from '@/services';

export default function SecretaryPatientsPage() {
  const [patients, setPatients] = useState<SecretaryPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<SecretaryPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<SecretaryPatient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    loadPatients();
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

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await secretaryService.getMyPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientAppointments = async (patient: SecretaryPatient) => {
    setSelectedPatient(patient);
    setLoadingAppointments(true);
    setError('');
    try {
      console.log('Loading appointments for patient:', patient.id);
      const history = await secretaryService.getPatientAppointments(patient.id);
      console.log('Loaded appointments:', history);
      setAppointments(history);
      if (history.length === 0) {
        console.warn('No appointments found for patient');
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
    setSelectedPatient(null);
    setAppointments([]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show appointment history view
  if (selectedPatient) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Appointment History - {selectedPatient.firstName} {selectedPatient.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedPatient.email}
            </p>
          </div>
          <Button onClick={closeAppointmentView} variant="outline">
            ← Back to Patients
          </Button>
        </div>

        {loadingAppointments ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">⚠️</span>
              <p className="text-lg font-medium text-destructive">{error}</p>
              <Button onClick={() => loadPatientAppointments(selectedPatient)} className="mt-4" variant="outline">
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
                This patient has no appointment history yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} formatDate={formatDate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Patients</h1>
        <p className="text-muted-foreground mt-1">
          View patients from all your assigned doctors
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && patients.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-5xl">👥</span>
              <h3 className="mt-4 text-lg font-semibold">No Patients Yet</h3>
              <p className="text-muted-foreground mt-2">
                Patients will appear here when your assigned doctors have appointments
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!isLoading && searchTerm && filteredPatients.length === 0 && patients.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-5xl">🔍</span>
              <h3 className="mt-4 text-lg font-semibold">No Results Found</h3>
              <p className="text-muted-foreground mt-2">
                No patients match your search criteria
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patients Grid */}
      {!isLoading && filteredPatients.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                formatDate={formatDate}
                onViewHistory={() => loadPatientAppointments(patient)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface PatientCardProps {
  patient: SecretaryPatient;
  formatDate: (date?: string) => string;
  onViewHistory: () => void;
}

function PatientCard({ patient, formatDate, onViewHistory }: PatientCardProps) {
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
          {patient.lastDoctor && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary" className="truncate max-w-full">
                Last seen by: {patient.lastDoctor}
              </Badge>
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
  formatDate: (date?: string) => string;
}

function AppointmentCard({ appointment, formatDate }: AppointmentCardProps) {
  const formatDateTime = (dateString: string) => {
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
              Dr. {appointment.doctor.fullName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {appointment.doctor.specialization || 'General Medicine'}
            </p>
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
            <span>{formatDateTime(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💼</span>
            <Badge variant="outline">{appointment.type}</Badge>
          </div>
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
