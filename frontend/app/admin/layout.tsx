'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { ProtectedRoute } from '@/components/auth';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store';
import { useAuth } from '@/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function AdminDashboardLayout({ children }: DashboardLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
          <div className="p-6 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏥</span>
              <span className="text-xl font-bold text-primary">HealthFlow</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem href={ROUTES.ADMIN.DASHBOARD} icon="📊" label="Dashboard" />
            <NavItem href={ROUTES.ADMIN.USERS} icon="👥" label="Users" />
            <NavItem href={ROUTES.ADMIN.DOCTORS} icon="👨‍⚕️" label="Doctors" />
            <NavItem href={ROUTES.ADMIN.CLINICS} icon="🏥" label="Clinics" />
            <NavItem href={ROUTES.ADMIN.SPECIALIZATIONS} icon="🏷️" label="Specializations" />
            <NavItem href={ROUTES.ADMIN.SETTINGS} icon="⚙️" label="Settings" />
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b flex items-center justify-between px-6">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-muted">
                <span className="text-xl">🔔</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
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
