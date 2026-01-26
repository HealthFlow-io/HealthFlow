'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { AppointmentStatus } from '@/types';

// Mock data
const mockAppointments = [
  {
    id: '1',
    doctor: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    date: '2026-01-27',
    startTime: '10:00',
    endTime: '10:30',
    type: 'PHYSICAL' as const,
    status: 'Approved' as AppointmentStatus,
    clinicAddress: '123 Medical Center, New York',
  },
  {
    id: '2',
    doctor: 'Dr. Michael Chen',
    specialization: 'General Medicine',
    date: '2026-01-30',
    startTime: '14:30',
    endTime: '15:00',
    type: 'ONLINE' as const,
    status: 'Pending' as AppointmentStatus,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: '3',
    doctor: 'Dr. Emily Williams',
    specialization: 'Dermatology',
    date: '2026-01-15',
    startTime: '09:00',
    endTime: '09:30',
    type: 'PHYSICAL' as const,
    status: 'Done' as AppointmentStatus,
    clinicAddress: '456 Health Plaza, New York',
  },
  {
    id: '4',
    doctor: 'Dr. Ahmed Hassan',
    specialization: 'Orthopedics',
    date: '2026-01-10',
    startTime: '11:00',
    endTime: '11:45',
    type: 'PHYSICAL' as const,
    status: 'Cancelled' as AppointmentStatus,
    clinicAddress: '789 Care Center, New York',
  },
];

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  Done: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

type TabType = 'upcoming' | 'past' | 'all';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = mockAppointments.filter((apt) => {
    if (activeTab === 'upcoming') {
      return apt.date >= today && apt.status !== 'Cancelled' && apt.status !== 'Done';
    }
    if (activeTab === 'past') {
      return apt.date < today || apt.status === 'Done' || apt.status === 'Cancelled';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">My Appointments</h2>
          <p className="text-muted-foreground">Manage your medical appointments</p>
        </div>
        <Button>Book New Appointment</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
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
                {activeTab === 'upcoming'
                  ? 'You have no upcoming appointments'
                  : 'No appointments in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{appointment.doctor}</h3>
                      <p className="text-primary">{appointment.specialization}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📅 {formatDate(appointment.date)}</span>
                        <span>🕐 {appointment.startTime} - {appointment.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {appointment.type === 'ONLINE' ? (
                          <span>💻 Online Consultation</span>
                        ) : (
                          <span>🏥 {appointment.clinicAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[appointment.status]
                      }`}
                    >
                      {appointment.status}
                    </span>

                    <div className="flex gap-2 mt-2">
                      {appointment.status === 'Approved' && appointment.type === 'ONLINE' && (
                        <Button size="sm">Join Meeting</Button>
                      )}
                      {appointment.status === 'Pending' && (
                        <Button size="sm" variant="destructive">
                          Cancel
                        </Button>
                      )}
                      {appointment.status === 'Approved' && (
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
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
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
