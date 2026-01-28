'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { appointmentService, adminService } from '@/services';
import { Appointment, AppointmentStatus, Doctor } from '@/types';

type TabType = 'pending' | 'approved' | 'all';

export default function SecretaryAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load secretary profile with assigned doctors
      const secretaryProfile = await adminService.getMySecretaryProfile();
      const doctors = secretaryProfile.doctors || [];
      setAssignedDoctors(doctors);

      // Load appointments for all assigned doctors
      const allAppointments: Appointment[] = [];
      for (const doctor of doctors) {
        try {
          const response = await appointmentService.getByDoctor(doctor.id);
          const doctorAppointments = response.data || response as unknown as Appointment[];
          allAppointments.push(...doctorAppointments);
        } catch (err) {
          console.error(`Failed to load appointments for doctor ${doctor.id}:`, err);
        }
      }

      // Sort by date
      allAppointments.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA) || (b.startTime || '').localeCompare(a.startTime || '');
      });

      setAppointments(allAppointments);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setError('');
      await appointmentService.approve(id);
      await loadData();
    } catch (err) {
      console.error('Failed to approve:', err);
      setError('Failed to approve appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Are you sure you want to decline this appointment?')) return;
    
    try {
      setProcessingId(id);
      setError('');
      await appointmentService.decline(id);
      await loadData();
    } catch (err) {
      console.error('Failed to decline:', err);
      setError('Failed to decline appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = apt.date || '';
    
    // Filter by search date
    if (searchDate && aptDate !== searchDate) return false;
    
    // Filter by tab
    if (activeTab === 'pending') {
      return String(apt.status).toLowerCase() === 'pending';
    }
    if (activeTab === 'approved') {
      return String(apt.status).toLowerCase() === 'approved';
    }
    return true; // all
  });

  const pendingCount = appointments.filter(a => 
    String(a.status).toLowerCase() === 'pending'
  ).length;

  const approvedCount = appointments.filter(a => 
    String(a.status).toLowerCase() === 'approved'
  ).length;

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
          <h2 className="text-3xl font-bold">Appointments</h2>
          <p className="text-muted-foreground">Manage appointments for your assigned doctors</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-auto"
          />
          {searchDate && (
            <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {assignedDoctors.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-4 block">👨‍⚕️</span>
            <p className="text-lg font-medium">No doctors assigned</p>
            <p className="text-muted-foreground">
              Contact your administrator to assign doctors to your account
            </p>
          </CardContent>
        </Card>
      )}

      {assignedDoctors.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
              Pending {pendingCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabButton>
            <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}>
              Approved {approvedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  {approvedCount}
                </span>
              )}
            </TabButton>
            <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
              All ({appointments.length})
            </TabButton>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <span className="text-4xl mb-4 block">📅</span>
                  <p className="text-lg font-medium">No appointments found</p>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending'
                      ? 'No pending appointments at this time'
                      : 'No appointments in this category'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onApprove={() => handleApprove(appointment.id)}
                  onDecline={() => handleDecline(appointment.id)}
                  isProcessing={processingId === appointment.id}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onApprove: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

function AppointmentCard({ appointment, onApprove, onDecline, isProcessing }: AppointmentCardProps) {
  const doctor = appointment.doctor;
  const doctorName = doctor?.fullName || `Dr. ${doctor?.firstName} ${doctor?.lastName}` || 'Doctor';
  const patient = appointment.patient;
  const patientName = patient 
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient';
  const isPending = String(appointment.status).toLowerCase() === 'pending';

  return (
    <Card className={isPending ? 'border-yellow-200' : ''}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👤</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{patientName}</h3>
              <p className="text-sm text-muted-foreground">{patient?.email}</p>
              <p className="text-sm font-medium text-primary">with {doctorName}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {formatDate(appointment.date || '')}</span>
                <span>🕐 {appointment.startTime} - {appointment.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {appointment.type === 'ONLINE' ? (
                  <span>💻 Online Consultation</span>
                ) : (
                  <span>🏥 In-person</span>
                )}
              </div>
              {appointment.reason && (
                <p className="text-sm mt-2">
                  <strong>Reason:</strong> {appointment.reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}
            >
              {appointment.status}
            </span>

            {isPending && (
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  onClick={onApprove}
                  isLoading={isProcessing}
                >
                  ✓ Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={onDecline}
                  isLoading={isProcessing}
                >
                  ✕ Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[2px] ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function getStatusColor(status: AppointmentStatus | string): string {
  const statusStr = String(status).toLowerCase();
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    done: 'bg-blue-100 text-blue-800',
  };
  return colors[statusStr] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
