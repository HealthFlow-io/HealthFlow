'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { AppointmentStatus } from '@/types';

// Mock appointments data
const mockAppointments = [
  {
    id: '1',
    patient: 'John Smith',
    patientEmail: 'john.smith@email.com',
    date: '2026-01-27',
    startTime: '09:00',
    endTime: '09:30',
    type: 'PHYSICAL' as const,
    status: 'Approved' as AppointmentStatus,
    reason: 'Regular check-up',
  },
  {
    id: '2',
    patient: 'Emma Davis',
    patientEmail: 'emma.davis@email.com',
    date: '2026-01-27',
    startTime: '10:00',
    endTime: '10:30',
    type: 'ONLINE' as const,
    status: 'Approved' as AppointmentStatus,
    reason: 'Follow-up consultation',
  },
  {
    id: '3',
    patient: 'Alice Johnson',
    patientEmail: 'alice.j@email.com',
    date: '2026-01-28',
    startTime: '10:00',
    endTime: '10:30',
    type: 'ONLINE' as const,
    status: 'Pending' as AppointmentStatus,
    reason: 'Annual check-up',
  },
  {
    id: '4',
    patient: 'Robert Martinez',
    patientEmail: 'robert.m@email.com',
    date: '2026-01-29',
    startTime: '14:30',
    endTime: '15:00',
    type: 'PHYSICAL' as const,
    status: 'Pending' as AppointmentStatus,
    reason: 'Follow-up consultation',
  },
  {
    id: '5',
    patient: 'Michael Brown',
    patientEmail: 'michael.b@email.com',
    date: '2026-01-20',
    startTime: '11:00',
    endTime: '11:30',
    type: 'PHYSICAL' as const,
    status: 'Done' as AppointmentStatus,
    reason: 'Chest pain evaluation',
  },
];

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  Done: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

type FilterType = 'all' | 'pending' | 'approved' | 'completed';

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredAppointments = mockAppointments.filter((apt) => {
    switch (filter) {
      case 'pending':
        return apt.status === 'Pending';
      case 'approved':
        return apt.status === 'Approved';
      case 'completed':
        return apt.status === 'Done';
      default:
        return true;
    }
  });

  const pendingCount = mockAppointments.filter((a) => a.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Appointments</h2>
          <p className="text-muted-foreground">Manage your patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium">
              {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterButton>
        <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Pending ({pendingCount})
        </FilterButton>
        <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')}>
          Approved
        </FilterButton>
        <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
          Completed
        </FilterButton>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">📅</span>
              <p className="text-lg font-medium">No appointments found</p>
              <p className="text-muted-foreground">No appointments match the current filter</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              className={appointment.status === 'Pending' ? 'border-yellow-300 dark:border-yellow-800' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{appointment.patient}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.patientEmail}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>📅 {formatDate(appointment.date)}</span>
                        <span>🕐 {appointment.startTime} - {appointment.endTime}</span>
                        <span>
                          {appointment.type === 'ONLINE' ? '💻 Online' : '🏥 Physical'}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Reason:</span> {appointment.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[appointment.status]
                      }`}
                    >
                      {appointment.status}
                    </span>

                    <div className="flex gap-2">
                      {appointment.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                          <Button size="sm">Approve</Button>
                        </>
                      )}
                      {appointment.status === 'Approved' && appointment.type === 'ONLINE' && (
                        <Button size="sm">Start Call</Button>
                      )}
                      {appointment.status === 'Approved' && (
                        <>
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                          <Button size="sm" variant="secondary">
                            Mark Complete
                          </Button>
                        </>
                      )}
                      {appointment.status === 'Done' && (
                        <Button size="sm" variant="outline">
                          Add Notes
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        View
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

function FilterButton({
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
  });
}
