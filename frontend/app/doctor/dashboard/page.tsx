import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Good morning, Dr. Johnson!</h2>
          <p className="text-muted-foreground">Here&apos;s your schedule for today</p>
        </div>
        <Button>Update Availability</Button>
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
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 online, 3 physical</p>
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
            <div className="text-3xl font-bold text-yellow-600">3</div>
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
            <div className="text-3xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Total appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
            <span className="text-2xl">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.9</div>
            <p className="text-xs text-muted-foreground">Based on 245 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <Button variant="outline" size="sm">View Full Calendar</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScheduleItem
              time="09:00 - 09:30"
              patient="John Smith"
              type="Physical"
              status="Completed"
            />
            <ScheduleItem
              time="10:00 - 10:30"
              patient="Emma Davis"
              type="Online"
              status="In Progress"
              isActive
            />
            <ScheduleItem
              time="11:00 - 11:30"
              patient="Michael Brown"
              type="Physical"
              status="Upcoming"
            />
            <ScheduleItem
              time="14:00 - 14:30"
              patient="Sarah Wilson"
              type="Online"
              status="Upcoming"
            />
            <ScheduleItem
              time="15:00 - 15:30"
              patient="David Lee"
              type="Physical"
              status="Upcoming"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Appointment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <RequestItem
              patient="Alice Johnson"
              date="Jan 28, 2026"
              time="10:00 AM"
              type="Online"
              reason="Annual check-up"
            />
            <RequestItem
              patient="Robert Martinez"
              date="Jan 29, 2026"
              time="2:30 PM"
              type="Physical"
              reason="Follow-up consultation"
            />
            <RequestItem
              patient="Jennifer Taylor"
              date="Jan 30, 2026"
              time="11:00 AM"
              type="Online"
              reason="New patient consultation"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleItem({
  time,
  patient,
  type,
  status,
  isActive = false,
}: {
  time: string;
  patient: string;
  type: 'Physical' | 'Online';
  status: 'Completed' | 'In Progress' | 'Upcoming';
  isActive?: boolean;
}) {
  const statusColors = {
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Upcoming: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        isActive ? 'border-primary bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[100px]">
          <p className="font-medium">{time}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span>👤</span>
        </div>
        <div>
          <p className="font-medium">{patient}</p>
          <p className="text-sm text-muted-foreground">
            {type === 'Online' ? '💻 Video Call' : '🏥 In-Person'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
        {status === 'In Progress' && <Button size="sm">Join Call</Button>}
        {status === 'Upcoming' && (
          <Button size="sm" variant="outline">
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}

function RequestItem({
  patient,
  date,
  time,
  type,
  reason,
}: {
  patient: string;
  date: string;
  time: string;
  type: 'Physical' | 'Online';
  reason: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
          <span>👤</span>
        </div>
        <div>
          <p className="font-medium">{patient}</p>
          <p className="text-sm text-muted-foreground">
            {date} at {time} • {type === 'Online' ? '💻 Online' : '🏥 Physical'}
          </p>
          <p className="text-sm text-muted-foreground">Reason: {reason}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          Decline
        </Button>
        <Button size="sm">Approve</Button>
      </div>
    </div>
  );
}
