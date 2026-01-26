'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { adminService, AdminStats } from '@/services';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // Use mock data if API fails
      setStats({
        totalUsers: 0,
        totalDoctors: 0,
        totalPatients: 0,
        totalAppointments: 0,
        totalClinics: 0,
        appointmentsToday: 0,
        pendingAppointments: 0,
      });
      setError('Failed to load statistics. Showing default values.');
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
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to the admin panel</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-yellow-800 bg-yellow-100 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors || 0}
          icon="👨‍⚕️"
          color="bg-green-500"
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon="🏥"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Clinics"
          value={stats?.totalClinics || 0}
          icon="🏢"
          color="bg-orange-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Appointments"
          value={stats?.totalAppointments || 0}
          icon="📅"
          color="bg-teal-500"
        />
        <StatCard
          title="Appointments Today"
          value={stats?.appointmentsToday || 0}
          icon="📆"
          color="bg-indigo-500"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingAppointments || 0}
          icon="⏳"
          color="bg-yellow-500"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction href="/admin/users" icon="👤" label="Add User" />
            <QuickAction href="/admin/doctors" icon="👨‍⚕️" label="Add Doctor" />
            <QuickAction href="/admin/clinics" icon="🏥" label="Add Clinic" />
            <QuickAction href="/admin/specializations" icon="🏷️" label="Add Specialization" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-2xl text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
