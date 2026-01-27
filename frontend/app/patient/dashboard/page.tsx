'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService } from '@/services';
import { Appointment, AppointmentStatus } from '@/types';
import { ROUTES } from '@/lib/constants';

interface DashboardStats {
  upcomingAppointments: number;
  completedVisits: number;
  pendingAppointments: number;
}

export default function PatientDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    completedVisits: 0,
    pendingAppointments: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await appointmentService.getByPatient(user!.id);
      const appointments = response.data || response as unknown as Appointment[];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate stats
      const upcoming = appointments.filter(a => {
        const date = a.date || '';
        return date >= today && 
          (a.status === AppointmentStatus.Approved || a.status === AppointmentStatus.Pending);
      });
      
      const completed = appointments.filter(a => a.status === AppointmentStatus.Done);
      const pending = appointments.filter(a => a.status === AppointmentStatus.Pending);
      
      setStats({
        upcomingAppointments: upcoming.length,
        completedVisits: completed.length,
        pendingAppointments: pending.length,
      });
      
      // Get next 3 upcoming appointments
      setUpcomingAppointments(upcoming.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
      <div>
        <h2 className="text-3xl font-bold">
          Welcome back, {user?.firstName || 'Patient'}!
        </h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your health journey</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Book Appointment"
          description="Schedule a new consultation"
          icon="📅"
          href={ROUTES.PATIENT.DOCTORS}
        />
        <QuickActionCard
          title="My Appointments"
          description="View upcoming visits"
          icon="📋"
          href={ROUTES.PATIENT.APPOINTMENTS}
        />
        <QuickActionCard
          title="My Profile"
          description="View and edit your profile"
          icon="👤"
          href={ROUTES.PATIENT.PROFILE}
        />
        <QuickActionCard
          title="Find Doctors"
          description="Browse available doctors"
          icon="👨‍⚕️"
          href={ROUTES.PATIENT.DOCTORS}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingAppointments === 0 
                ? 'No upcoming appointments' 
                : `${stats.pendingAppointments} pending approval`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Visits
            </CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedVisits}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">Awaiting doctor confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Upcoming Appointments</CardTitle>
          <Link href={ROUTES.PATIENT.APPOINTMENTS}>
            <Button variant="ghost" size="sm">View All →</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-4">📅</span>
              <p className="text-muted-foreground mb-4">No upcoming appointments</p>
              <Link href={ROUTES.PATIENT.DOCTORS}>
                <Button>Book an Appointment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentItem key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const doctor = appointment.doctor;
  const doctorName = doctor?.fullName || 
    (doctor?.firstName && doctor?.lastName ? `${doctor.firstName} ${doctor.lastName}` : null) ||
    (doctor?.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : 'Doctor');
  const specialization = doctor?.specialization?.name || 'General';
  const clinicName = appointment.clinic?.name || 'Not specified';
  const aptDate = appointment.date || '';
  const isOnline = appointment.type === 'ONLINE';

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">👨‍⚕️</span>
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Dr. {doctorName}</h4>
            <p className="text-sm text-muted-foreground">{specialization}</p>
            {!isOnline && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {clinicName}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusColors[appointment.status] || 'bg-gray-100'}`}>
          {appointment.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>📅</span>
          <span>{formatDate(aptDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🕐</span>
          <span>{appointment.startTime} - {appointment.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{isOnline ? '💻' : '🏥'}</span>
          <span>{isOnline ? 'Online' : 'In-person'}</span>
        </div>
      </div>

      {appointment.reason && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Reason:</span> {appointment.reason}
        </p>
      )}

      {isOnline && appointment.meetingLink && appointment.status === AppointmentStatus.Approved && (
        <div className="pt-2 border-t">
          <a 
            href={appointment.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            🔗 Join Meeting
          </a>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
