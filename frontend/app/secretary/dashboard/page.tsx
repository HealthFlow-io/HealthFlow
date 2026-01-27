'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService, adminService } from '@/services';
import { Appointment, AppointmentStatus, Doctor } from '@/types';

interface DashboardStats {
  pendingAppointments: number;
  approvedToday: number;
  totalDoctors: number;
}

export default function SecretaryDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats>({
    pendingAppointments: 0,
    approvedToday: 0,
    totalDoctors: 0,
  });
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load secretary profile with assigned doctors
      const secretaryProfile = await adminService.getMySecretaryProfile();
      console.log('Secretary profile:', secretaryProfile);
      
      const doctors = secretaryProfile.doctors || [];
      setAssignedDoctors(doctors);

      // Load appointments for all assigned doctors
      const allAppointments: Appointment[] = [];
      for (const doctor of doctors) {
        try {
          const response = await appointmentService.getByDoctor(doctor.id, {});
          const doctorAppointments = response.data || [];
          allAppointments.push(...doctorAppointments);
        } catch (err) {
          console.error(`Failed to load appointments for doctor ${doctor.id}:`, err);
        }
      }

      // Filter pending appointments
      const pending = allAppointments.filter(a => a.status === AppointmentStatus.Pending);
      
      // Count approved today
      const today = new Date().toISOString().split('T')[0];
      const approvedToday = allAppointments.filter(a => 
        a.status === AppointmentStatus.Approved && 
        a.createdAt?.startsWith(today)
      ).length;

      setStats({
        pendingAppointments: pending.length,
        approvedToday,
        totalDoctors: doctors.length,
      });

      setPendingAppointments(pending.slice(0, 5)); // Show first 5
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApprove = async (appointmentId: string) => {
    try {
      await appointmentService.approve(appointmentId);
      // Reload data
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to approve appointment:', err);
      setError('Failed to approve appointment');
    }
  };

  const handleDecline = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to decline this appointment?')) return;
    
    try {
      await appointmentService.decline(appointmentId);
      // Reload data
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to decline appointment:', err);
      setError('Failed to decline appointment');
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
          Welcome, {user?.firstName || 'Secretary'}!
        </h2>
        <p className="text-muted-foreground">Manage appointments for your assigned doctors</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Today
            </CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">Appointments approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Doctors
            </CardTitle>
            <span className="text-2xl">👨‍⚕️</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Under your management</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Doctors */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedDoctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl block mb-4">👨‍⚕️</span>
              <p>No doctors assigned yet</p>
              <p className="text-sm">Contact your administrator to assign doctors</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {assignedDoctors.map((doctor) => (
                <div key={doctor.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium">
                    Dr. {doctor.fullName || `${doctor.firstName} ${doctor.lastName}`}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialization?.name || 'General Medicine'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl block mb-4">✅</span>
              <p>No pending appointments</p>
              <p className="text-sm">All appointments have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onApprove,
  onDecline,
}: {
  appointment: Appointment;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const doctor = appointment.doctor;
  const doctorName = doctor?.fullName || `Dr. ${doctor?.firstName} ${doctor?.lastName}` || 'Doctor';
  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : 'Patient';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <h4 className="font-medium">{patientName}</h4>
            <p className="text-sm text-muted-foreground">with {doctorName}</p>
          </div>
        </div>
        <div className="ml-14 space-y-1">
          <p className="text-sm">
            📅 {formatDate(appointment.date)} at {appointment.startTime}
          </p>
          <p className="text-sm">
            {appointment.type === 'ONLINE' ? '💻 Online' : '🏥 In-person'}
          </p>
          {appointment.reason && (
            <p className="text-sm text-muted-foreground">
              Reason: {appointment.reason}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Button size="sm" onClick={() => onApprove(appointment.id)}>
          ✓ Approve
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onDecline(appointment.id)}
          className="text-destructive hover:text-destructive"
        >
          ✗ Decline
        </Button>
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
    year: 'numeric',
  });
}
