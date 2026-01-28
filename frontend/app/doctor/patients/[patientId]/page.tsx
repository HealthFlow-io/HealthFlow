'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { medicalRecordService } from '@/services/medical-record.service';
import { appointmentService, doctorService } from '@/services';
import { MedicalRecord, Appointment } from '@/types';

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  appointmentCount: number;
}

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get doctor profile to get doctor ID
      const doctor = await doctorService.getMyProfile();
      
      // Load appointments and medical records in parallel
      const [appointmentsResponse, recordsResponse] = await Promise.all([
        appointmentService.getByDoctor(doctor.id),
        medicalRecordService.getByPatient(patientId as string)
      ]);

      const appointments = appointmentsResponse.data || appointmentsResponse as unknown as Appointment[];
      
      // Find patient from appointments
      const patientAppointments = appointments.filter(
        (apt: Appointment) => apt.patient?.id === patientId || apt.patientId === patientId
      );

      if (patientAppointments.length === 0) {
        setError('Patient not found or you do not have access to this patient.');
        return;
      }

      const firstApt = patientAppointments[0];
      setPatient({
        id: patientId as string,
        firstName: firstApt.patient?.firstName || '',
        lastName: firstApt.patient?.lastName || '',
        email: firstApt.patient?.email || '',
        phone: firstApt.patient?.phone,
        appointmentCount: patientAppointments.length
      });
      
      setMedicalRecords(recordsResponse || []);
    } catch (err: unknown) {
      console.error('Error loading patient data:', err);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-4xl">⚠️</span>
              <h2 className="mt-4 text-lg font-semibold text-destructive">
                {error || 'Patient not found'}
              </h2>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/doctor/patients')}
              >
                Back to Patients
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/doctor/patients')}
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">{patient.email}</p>
          </div>
        </div>
        <Link href={`/doctor/patients/${patientId}/records/new`}>
          <Button>+ Add Medical Record</Button>
        </Link>
      </div>

      {/* Patient Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{patient.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          Medical Records ({medicalRecords.length})
        </h2>
      </div>

      {medicalRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-5xl">📋</span>
              <h3 className="mt-4 text-lg font-semibold">No Medical Records</h3>
              <p className="text-muted-foreground mt-2">
                This patient has no medical records yet.
              </p>
              <Link href={`/doctor/patients/${patientId}/records/new`}>
                <Button className="mt-4">Create First Record</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {medicalRecords.map((record) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              patientId={patientId as string}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MedicalRecordCardProps {
  record: MedicalRecord;
  patientId: string;
}

function MedicalRecordCard({ record, patientId }: MedicalRecordCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-medium">{formatDate(record.createdAt)}</span>
              {record.followUpDate && (
                <Badge variant="outline" className="ml-2">
                  Follow-up: {formatDate(record.followUpDate)}
                </Badge>
              )}
            </div>

            {record.diagnosis && (
              <div>
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="font-medium">{record.diagnosis}</p>
              </div>
            )}

            {record.symptoms && (
              <div>
                <p className="text-sm text-muted-foreground">Symptoms</p>
                <p>{record.symptoms}</p>
              </div>
            )}

            {record.treatment && (
              <div>
                <p className="text-sm text-muted-foreground">Treatment</p>
                <p>{record.treatment}</p>
              </div>
            )}

            {record.vitalSigns && (
              <div className="flex flex-wrap gap-3 pt-2">
                {(record.vitalSigns.bloodPressureSystolic || record.vitalSigns.bloodPressureDiastolic) && (
                  <Badge variant="secondary">
                    BP: {record.vitalSigns.bloodPressureSystolic || '-'}/{record.vitalSigns.bloodPressureDiastolic || '-'}
                  </Badge>
                )}
                {record.vitalSigns.heartRate && (
                  <Badge variant="secondary">
                    HR: {record.vitalSigns.heartRate} bpm
                  </Badge>
                )}
                {record.vitalSigns.temperature && (
                  <Badge variant="secondary">
                    Temp: {record.vitalSigns.temperature}°C
                  </Badge>
                )}
                {record.vitalSigns.weight && (
                  <Badge variant="secondary">
                    Weight: {record.vitalSigns.weight} kg
                  </Badge>
                )}
              </div>
            )}

            {record.attachments && record.attachments.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📎</span>
                <span>{record.attachments.length} attachment(s)</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/doctor/patients/${patientId}/records/${record.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href={`/doctor/patients/${patientId}/records/${record.id}/edit`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
