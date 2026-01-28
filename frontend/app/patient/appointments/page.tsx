'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { Appointment, AppointmentStatus } from '@/types';
import { appointmentService } from '@/services';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/lib/constants';

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  Done: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

type TabType = 'upcoming' | 'past' | 'all';

export default function PatientAppointmentsPage() {
  const user = useAuthStore((state) => state.user);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await appointmentService.getByPatient(user!.id);
      setAppointments(response.data || response as unknown as Appointment[]);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      setCancellingId(id);
      await appointmentService.cancel(id);
      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: AppointmentStatus.Cancelled } : apt
      ));
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError('Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = apt.date || '';
    if (activeTab === 'upcoming') {
      return aptDate >= today && apt.status !== AppointmentStatus.Cancelled && apt.status !== AppointmentStatus.Done;
    }
    if (activeTab === 'past') {
      return aptDate < today || apt.status === AppointmentStatus.Done || apt.status === AppointmentStatus.Cancelled;
    }
    return true;
  });

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
          <h2 className="text-3xl font-bold">My Appointments</h2>
          <p className="text-muted-foreground">Manage your medical appointments</p>
        </div>
        <Link href={ROUTES.PATIENT.DOCTORS}>
          <Button>Book New Appointment</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadAppointments}>
            Retry
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')}>
          Upcoming ({appointments.filter(a => {
            const d = a.date || '';
            return d >= today && a.status !== AppointmentStatus.Cancelled && a.status !== AppointmentStatus.Done;
          }).length})
        </TabButton>
        <TabButton active={activeTab === 'past'} onClick={() => setActiveTab('past')}>
          Past
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
              <p className="text-muted-foreground mb-4">
                {activeTab === 'upcoming'
                  ? 'You have no upcoming appointments'
                  : 'No appointments in this category'}
              </p>
              <Link href={ROUTES.PATIENT.DOCTORS}>
                <Button>Find a Doctor</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
              isCancelling={cancellingId === appointment.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

function AppointmentCard({ appointment, onCancel, isCancelling }: AppointmentCardProps) {
  console.log('Rendering AppointmentCard for appointment:', appointment);
  const doctor = appointment.doctor;
  const doctorName = doctor?.fullName
    ? `Dr. ${doctor.fullName}`
    : 'Doctor';
  const specialization = doctor?.specializationName || 'General';
  const aptDate = appointment.date || '';
  const aptStatus = (appointment.status as AppointmentStatus) || AppointmentStatus.Pending;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{doctorName}</h3>
              <p className="text-primary">{specialization}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {formatDate(aptDate)}</span>
                <span>🕐 {appointment.startTime} - {appointment.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {appointment.type === 'ONLINE' ? (
                  <span>💻 Online Consultation</span>
                ) : (
                  <span>🏥 {appointment.clinic?.address || 'In-person'}</span>
                )}
              </div>
              {appointment.reason && (
                <p className="text-sm text-muted-foreground mt-2">
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
              {aptStatus === AppointmentStatus.Approved && 
               appointment.type === 'ONLINE' && 
               appointment.meetingLink && (
                <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm">Join Meeting</Button>
                </a>
              )}
              {(aptStatus === AppointmentStatus.Pending || aptStatus === AppointmentStatus.Approved) && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onCancel(appointment.id)}
                  isLoading={isCancelling}
                >
                  Cancel
                </Button>
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
