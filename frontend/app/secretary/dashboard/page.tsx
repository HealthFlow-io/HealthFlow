'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { useAuthStore } from '@/store';
import { appointmentService, adminService } from '@/services';
import { Appointment, AppointmentStatus, Doctor } from '@/types';
import { connectToAppointments, disconnectFromAppointments } from '@/lib/signalr';

interface DashboardStats {
  pendingAppointments: number;
  approvedToday: number;
  totalDoctors: number;
}

export default function SecretaryDashboard() {
  const user = useAuthStore((state) => state.user);
  const [secretaryId, setSecretaryId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingAppointments: 0,
    approvedToday: 0,
    totalDoctors: 0,
  });
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('pending');

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load secretary profile with assigned doctors
      const secretaryProfile = await adminService.getMySecretaryProfile();
      console.log('Secretary profile:', secretaryProfile);
      
      const secId = secretaryProfile.id;
      setSecretaryId(secId);
      
      const doctors = secretaryProfile.doctors || [];
      setAssignedDoctors(doctors);

      // Load appointments for all assigned doctors
      const allAppointments: Appointment[] = [];
      console.log('📋 Loading appointments for doctors:', doctors.map(d => ({ id: d.id, name: d.fullName })));
      
      for (const doctor of doctors) {
        try {
          const response = await appointmentService.getByDoctor(doctor.id, {});
          const doctorAppointments = response.data || [];
          console.log(`📊 Doctor ${doctor.fullName} has ${doctorAppointments.length} appointments:`, 
            doctorAppointments.map(apt => ({ 
              id: apt.id, 
              status: apt.status, 
              statusType: typeof apt.status,
              date: apt.date 
            }))
          );
          allAppointments.push(...doctorAppointments);
        } catch (err) {
          console.error(`Failed to load appointments for doctor ${doctor.id}:`, err);
        }
      }

      console.log('📊 Total appointments loaded:', allAppointments.length);
      console.log('📊 All appointment statuses:', allAppointments.map(a => ({ 
        id: a.id, 
        status: a.status, 
        statusString: String(a.status),
        statusLower: String(a.status).toLowerCase()
      })));

      // Store all appointments for filtering
      setAllAppointments(allAppointments);

      // Filter pending appointments - handle both string and enum values
      const pending = allAppointments.filter(a => {
        const status = String(a.status).toLowerCase();
        return status === 'pending' || a.status === AppointmentStatus.Pending;
      });
      
      console.log('⏳ Pending appointments found:', pending.length, pending.map(p => ({ id: p.id, status: p.status })));
      
      // Count approved today
      const today = new Date().toISOString().split('T')[0];
      const approvedToday = allAppointments.filter(a => {
        const status = String(a.status).toLowerCase();
        return (status === 'approved' || a.status === AppointmentStatus.Approved) && 
               a.createdAt?.startsWith(today);
      }).length;

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

  // Filter appointments based on selected doctor and status
  useEffect(() => {
    if (!allAppointments || allAppointments.length === 0) return;

    let filtered = [...allAppointments];

    // Filter by doctor
    if (selectedDoctorId !== 'all') {
      filtered = filtered.filter(apt => apt.doctorId === selectedDoctorId);
    }

    // Filter by status
    if (appointmentStatusFilter !== 'all') {
      filtered = filtered.filter(apt => {
        const status = String(apt.status).toLowerCase();
        return status === appointmentStatusFilter.toLowerCase() || 
               apt.status === AppointmentStatus[appointmentStatusFilter as keyof typeof AppointmentStatus];
      });
    }

    setPendingAppointments(filtered);
  }, [allAppointments, selectedDoctorId, appointmentStatusFilter]);

  useEffect(() => {
    if (!assignedDoctors || assignedDoctors.length === 0 || isLoading) return;

    // Connect to SignalR and listen for real-time updates for all assigned doctors
    const doctorIds = assignedDoctors.map(d => d.id);
    
    console.log('🔌 Connecting to SignalR for doctors:', doctorIds);
    
    connectToAppointments({
      onNewRequest: (appointment: Appointment) => {
        console.log('🔔 New appointment request received:', appointment);
        // Reload dashboard data to reflect the new appointment
        loadDashboardData();
      },
      onStatusChanged: (appointment: Appointment) => {
        console.log('🔔 Appointment status changed:', appointment);
        // Reload dashboard data to reflect the status change
        loadDashboardData();
      },
    }, { doctorId: doctorIds[0] }); // Connect using first doctor for now

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting from SignalR');
      disconnectFromAppointments();
    };
  }, [assignedDoctors, isLoading, loadDashboardData]);

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
          <div className="flex items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <div className="flex gap-3">
              {/* Doctor Filter */}
              <div className="w-48">
                <Select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Doctors' },
                    ...assignedDoctors.map(doc => ({
                      value: doc.id,
                      label: `Dr. ${doc.fullName || `${doc.firstName} ${doc.lastName}`}`
                    }))
                  ]}
                  className="text-sm"
                />
              </div>
              {/* Status Filter */}
              <div className="w-40">
                <Select
                  value={appointmentStatusFilter}
                  onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'declined', label: 'Declined' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'done', label: 'Done' }
                  ]}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl block mb-4">✅</span>
              <p>No appointments found</p>
              <p className="text-sm">
                {appointmentStatusFilter === 'pending' 
                  ? 'All appointments have been processed' 
                  : 'No appointments match the selected filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">{pendingAppointments.map((appointment) => (
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

  const isPending = String(appointment.status).toLowerCase() === 'pending' || 
                   appointment.status === AppointmentStatus.Pending;

  const getStatusBadge = (status: string | AppointmentStatus) => {
    const statusStr = String(status).toLowerCase();
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      pending: 'secondary',
      approved: 'default',
      declined: 'destructive',
      cancelled: 'outline',
      done: 'outline'
    };
    return (
      <Badge variant={variants[statusStr] || 'default'}>
        {statusStr.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{patientName}</h4>
              {getStatusBadge(appointment.status)}
            </div>
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
      {isPending && (
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
      )}
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
