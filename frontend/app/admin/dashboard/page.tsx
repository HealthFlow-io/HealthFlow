import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="2,845"
          change="+12%"
          changeType="positive"
          icon="👥"
        />
        <StatCard
          title="Active Doctors"
          value="156"
          change="+5%"
          changeType="positive"
          icon="👨‍⚕️"
        />
        <StatCard
          title="Appointments Today"
          value="324"
          change="-2%"
          changeType="negative"
          icon="📅"
        />
        <StatCard
          title="Total Revenue"
          value="$48,250"
          change="+18%"
          changeType="positive"
          icon="💰"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'John Smith', email: 'john.s@email.com', role: 'Patient', date: 'Today' },
                { name: 'Dr. Emily Chen', email: 'emily.c@email.com', role: 'Doctor', date: 'Yesterday' },
                { name: 'Sarah Johnson', email: 'sarah.j@email.com', role: 'Patient', date: '2 days ago' },
                { name: 'Michael Brown', email: 'michael.b@email.com', role: 'Secretary', date: '3 days ago' },
              ].map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span>👤</span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                      {user.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{user.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatRow label="Total Appointments" value="12,450" />
              <StatRow label="Completed Appointments" value="10,234" />
              <StatRow label="Online Consultations" value="4,567" />
              <StatRow label="Active Clinics" value="45" />
              <StatRow label="Specializations" value="28" />
              <StatRow label="Average Rating" value="4.7 ⭐" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <StatusCard status="Pending" count={145} color="yellow" />
            <StatusCard status="Approved" count={890} color="green" />
            <StatusCard status="Completed" count={10234} color="blue" />
            <StatusCard status="Cancelled" count={456} color="gray" />
            <StatusCard status="Declined" count={78} color="red" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <ActionButton icon="👤" label="Add User" />
            <ActionButton icon="👨‍⚕️" label="Add Doctor" />
            <ActionButton icon="🏥" label="Add Clinic" />
            <ActionButton icon="🏷️" label="Add Specialization" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p
              className={`text-sm mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change} from last month
            </p>
          </div>
          <span className="text-4xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StatusCard({
  status,
  count,
  color,
}: {
  status: string;
  count: number;
  color: 'yellow' | 'green' | 'blue' | 'gray' | 'red';
}) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className={`p-4 rounded-lg text-center ${colorClasses[color]}`}>
      <p className="text-3xl font-bold">{count.toLocaleString()}</p>
      <p className="text-sm font-medium">{status}</p>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-muted transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
