'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService, doctorService } from '@/services';
import { Appointment, AppointmentStatus } from '@/types';
import { ROUTES } from '@/lib/constants';
import { connectToAppointments, disconnectFromAppointments } from '@/lib/signalr';

interface DashboardStats {
  todayAppointments: number;
  pendingRequests: number;
  weekTotal: number;
  completedToday: number;
}

export default function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingRequests: 0,
    weekTotal: 0,
    completedToday: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadDoctorProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!doctorId) return;

    // Connect to SignalR and listen for real-time updates
    connectToAppointments({
      onNewRequest: (appointment: Appointment) => {
        console.log('🔔 New appointment request received:', appointment);
        // Reload dashboard data to reflect the new appointment
        loadDashboardData(doctorId);
      },
      onStatusChanged: (appointment: Appointment) => {
        console.log('🔔 Appointment status changed:', appointment);
        // Reload dashboard data to reflect the status change
        loadDashboardData(doctorId);
      },
    }, { doctorId });

    // Cleanup on unmount
    return () => {
      disconnectFromAppointments();
    };
  }, [doctorId]);

  const loadDoctorProfile = async () => {
    try {
      const doctor = await doctorService.getMyProfile();
      console.log('🩺 Doctor profile loaded:', doctor);
      setDoctorId(doctor.id);
      await loadDashboardData(doctor.id);
    } catch (err) {
      console.error('Failed to load doctor profile:', err);
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (docId: string) => {
    try {
      setIsLoading(true);
      console.log('📋 Fetching appointments for doctor ID:', docId);
      const response = await appointmentService.getByDoctor(docId);
      const appointments = response.data || response as unknown as Appointment[];
      
      console.log('📊 Dashboard - Total appointments:', appointments.length);
      console.log('📊 Dashboard - Appointment statuses:', appointments.map(a => ({ id: a.id, status: a.status, type: typeof a.status })));
      
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Filter today's appointments
      const todaysApts = appointments.filter(a => {
        const date = a.date || '';
        const status = String(a.status).toLowerCase();
        return date === today && status !== 'cancelled';
      });
      
      // Pending requests - handle lowercase status from backend
      const pending = appointments.filter(a => 
        String(a.status).toLowerCase() === 'pending'
      );
      
      console.log('⏳ Pending appointments found:', pending.length);
      
      // This week
      const weekApts = appointments.filter(a => {
        const date = new Date(a.date || '');
        const status = String(a.status).toLowerCase();
        return date >= weekStart && date <= weekEnd && status !== 'cancelled';
      });
      
      // Completed today
      const completedToday = todaysApts.filter(a => 
        String(a.status).toLowerCase() === 'done'
      ).length;
      
      setStats({
        todayAppointments: todaysApts.length,
        pendingRequests: pending.length,
        weekTotal: weekApts.length,
        completedToday,
      });
      
      // Sort today's appointments by time
      setTodayAppointments(todaysApts.sort((a, b) => 
        (a.startTime || '').localeCompare(b.startTime || '')
      ));
      
      // Get first 5 pending
      setPendingAppointments(pending.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!doctorId) return;
    try {
      setProcessingId(id);
      await appointmentService.approve(id);
      await loadDashboardData(doctorId);
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Are you sure you want to decline this appointment?')) return;
    if (!doctorId) return;
    try {
      setProcessingId(id);
      await appointmentService.decline(id);
      await loadDashboardData(doctorId);
    } catch (err) {
      console.error('Failed to decline:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!doctorId) return;
    try {
      setProcessingId(id);
      await appointmentService.complete(id);
      await loadDashboardData(doctorId);
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">
            {greeting()}, Dr. {user?.lastName || 'Doctor'}!
          </h2>
          <p className="text-muted-foreground">Here&apos;s your schedule for today</p>
        </div>
        <Link href={ROUTES.DOCTOR.SCHEDULE}>
          <Button>Manage Schedule</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Appointments
            </CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.weekTotal}</div>
            <p className="text-xs text-muted-foreground">Total appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayAppointments - stats.completedToday} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingAppointments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-yellow-800">Pending Appointment Requests</CardTitle>
            <Link href={ROUTES.DOCTOR.APPOINTMENTS}>
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <p className="font-medium">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(apt.date || '')} at {apt.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(apt.id)}
                      isLoading={processingId === apt.id}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDecline(apt.id)}
                      disabled={processingId === apt.id}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <Link href={ROUTES.DOCTOR.APPOINTMENTS}>
            <Button variant="outline" size="sm">View All Appointments</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl block mb-4">📅</span>
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <ScheduleItem 
                  key={apt.id}
                  appointment={apt}
                  onComplete={() => handleComplete(apt.id)}
                  isProcessing={processingId === apt.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ScheduleItemProps {
  appointment: Appointment;
  onComplete: () => void;
  isProcessing: boolean;
}

function ScheduleItem({ appointment, onComplete, isProcessing }: ScheduleItemProps) {
  const patient = appointment.patient;
  const patientName = patient 
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient';
  const isOnline = appointment.type === 'ONLINE';
  const status = appointment.status as AppointmentStatus;

  const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    done: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg ${
      status === AppointmentStatus.Done ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[80px]">
          <p className="font-semibold">{appointment.startTime}</p>
          <p className="text-xs text-muted-foreground">{appointment.endTime}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          👤
        </div>
        <div>
          <p className="font-medium">{patientName}</p>
          <p className="text-sm text-muted-foreground">
            {isOnline ? '💻 Online' : '🏥 In-person'}
            {appointment.reason && ` • ${appointment.reason}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-blue-100'}`}>
          {status}
        </span>
        {status === AppointmentStatus.Approved && (
          <Button 
            size="sm" 
            onClick={onComplete}
            isLoading={isProcessing}
          >
            Mark Complete
          </Button>
        )}
        {status === AppointmentStatus.Approved && isOnline && appointment.meetingLink && (
          <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">Join</Button>
          </a>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
