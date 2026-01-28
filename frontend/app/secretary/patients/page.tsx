'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { secretaryService, SecretaryPatient } from '@/services';

export default function SecretaryPatientsPage() {
  const [patients, setPatients] = useState<SecretaryPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<SecretaryPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              <PatientCard key={patient.id} patient={patient} formatDate={formatDate} />
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
}

function PatientCard({ patient, formatDate }: PatientCardProps) {
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
      </CardContent>
    </Card>
  );
}
