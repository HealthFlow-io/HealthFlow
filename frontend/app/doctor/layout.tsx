import { ReactNode } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DoctorDashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold text-primary">HealthFlow</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Doctor Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href={ROUTES.DOCTOR.DASHBOARD} icon="📊" label="Dashboard" />
          <NavItem href={ROUTES.DOCTOR.APPOINTMENTS} icon="📅" label="Appointments" />
          <NavItem href={ROUTES.DOCTOR.SCHEDULE} icon="🗓️" label="My Schedule" />
          <NavItem href={ROUTES.DOCTOR.PATIENTS} icon="👥" label="Patients" />
          <NavItem href={ROUTES.DOCTOR.PROFILE} icon="👤" label="Profile" />
        </nav>

        <div className="p-4 border-t">
          <NavItem href="#" icon="🚪" label="Sign Out" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Doctor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full hover:bg-muted">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
              SJ
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
