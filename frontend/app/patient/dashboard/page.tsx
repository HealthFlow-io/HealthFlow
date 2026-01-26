import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import Link from 'next/link';

export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welcome back, John!</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your health journey</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Book Appointment"
          description="Schedule a new consultation"
          icon="📅"
          href="/patient/doctors"
        />
        <QuickActionCard
          title="My Appointments"
          description="View upcoming visits"
          icon="📋"
          href="/patient/appointments"
        />
        <QuickActionCard
          title="Medical Records"
          description="Access your health history"
          icon="📁"
          href="/patient/records"
        />
        <QuickActionCard
          title="Messages"
          description="Chat with your doctors"
          icon="💬"
          href="/patient/messages"
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
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Next: Tomorrow at 10:00 AM</p>
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
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prescriptions
            </CardTitle>
            <span className="text-2xl">💊</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active prescriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AppointmentItem
              doctor="Dr. Sarah Johnson"
              specialization="Cardiologist"
              date="Tomorrow"
              time="10:00 AM"
              type="Physical"
            />
            <AppointmentItem
              doctor="Dr. Michael Chen"
              specialization="General Physician"
              date="Jan 30, 2026"
              time="2:30 PM"
              type="Online"
            />
          </div>
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
      <Card className="cursor-pointer hover:border-primary transition-colors h-full">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
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

function AppointmentItem({
  doctor,
  specialization,
  date,
  time,
  type,
}: {
  doctor: string;
  specialization: string;
  date: string;
  time: string;
  type: 'Physical' | 'Online';
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl">👨‍⚕️</span>
        </div>
        <div>
          <p className="font-medium">{doctor}</p>
          <p className="text-sm text-muted-foreground">{specialization}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{date}</p>
        <p className="text-sm text-muted-foreground">{time}</p>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          type === 'Online'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}
      >
        {type}
      </div>
    </div>
  );
}
