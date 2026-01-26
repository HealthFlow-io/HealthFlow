'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService } from '@/services';
import { Appointment, AppointmentStatus } from '@/types';

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Declined: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-800',
  Done: 'bg-blue-100 text-blue-800',
};

type TabType = 'pending' | 'upcoming' | 'past' | 'all';

export default function DoctorAppointmentsPage() {
  const user = useAuthStore((state) => state.user);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await appointmentService.getByDoctor(user!.id);
      setAppointments(response.data || response as unknown as Appointment[]);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await appointmentService.approve(id);
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: AppointmentStatus.Approved } : apt
      ));
    } catch (err) {
      console.error('Failed to approve:', err);
      setError('Failed to approve appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    try {
      setProcessingId(id);
      await appointmentService.decline(id, reason || undefined);
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: AppointmentStatus.Declined } : apt
      ));
    } catch (err) {
      console.error('Failed to decline:', err);
      setError('Failed to decline appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setProcessingId(id);
      await appointmentService.complete(id);
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: AppointmentStatus.Done } : apt
      ));
    } catch (err) {
      console.error('Failed to complete:', err);
      setError('Failed to mark as complete');
    } finally {
      setProcessingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = apt.date || '';
    
    // Filter by search date
    if (searchDate && aptDate !== searchDate) return false;
    
    // Filter by tab
    if (activeTab === 'pending') {
      return apt.status === AppointmentStatus.Pending;
    }
    if (activeTab === 'upcoming') {
      return aptDate >= today && 
        (apt.status === AppointmentStatus.Approved || apt.status === AppointmentStatus.Pending);
    }
    if (activeTab === 'past') {
      return aptDate < today || apt.status === AppointmentStatus.Done;
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateA.localeCompare(dateB) || (a.startTime || '').localeCompare(b.startTime || '');
  });

  const pendingCount = appointments.filter(a => a.status === AppointmentStatus.Pending).length;

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
          <p className="text-muted-foreground">Manage your patient appointments</p>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
          Pending {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              {pendingCount}
            </span>
          )}
        </TabButton>
        <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')}>
          Upcoming
        </TabButton>
        <TabButton active={activeTab === 'past'} onClick={() => setActiveTab('past')}>
          Past
        </TabButton>
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
          All
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
                  ? 'No pending appointment requests'
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
              onComplete={() => handleComplete(appointment.id)}
              isProcessing={processingId === appointment.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onApprove: () => void;
  onDecline: () => void;
  onComplete: () => void;
  isProcessing: boolean;
}

function AppointmentCard({ appointment, onApprove, onDecline, onComplete, isProcessing }: AppointmentCardProps) {
  const patient = appointment.patient;
  const patientName = patient 
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient';
  const aptDate = appointment.date || '';
  const aptStatus = (appointment.status as AppointmentStatus) || AppointmentStatus.Pending;
  const isOnline = appointment.type === 'ONLINE';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👤</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{patientName}</h3>
              <p className="text-sm text-muted-foreground">{patient?.email}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {formatDate(aptDate)}</span>
                <span>🕐 {appointment.startTime} - {appointment.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isOnline ? (
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
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[aptStatus]
              }`}
            >
              {aptStatus}
            </span>

            <div className="flex gap-2 mt-2">
              {aptStatus === AppointmentStatus.Pending && (
                <>
                  <Button 
                    size="sm" 
                    onClick={onApprove}
                    isLoading={isProcessing}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onDecline}
                    disabled={isProcessing}
                  >
                    Decline
                  </Button>
                </>
              )}
              {aptStatus === AppointmentStatus.Approved && (
                <>
                  <Button 
                    size="sm" 
                    onClick={onComplete}
                    isLoading={isProcessing}
                  >
                    Mark Complete
                  </Button>
                  {isOnline && appointment.meetingLink && (
                    <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">Join Meeting</Button>
                    </a>
                  )}
                </>
              )}
            </div>
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
