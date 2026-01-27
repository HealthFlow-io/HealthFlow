'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { ProtectedRoute } from '@/components/auth';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store';
import { useAuth } from '@/hooks';

interface SecretaryLayoutProps {
  children: ReactNode;
}

export default function SecretaryLayout({ children }: SecretaryLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.Secretary]}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
          <div className="p-6 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏥</span>
              <span className="text-xl font-bold text-primary">HealthFlow</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Secretary Portal</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem 
              href={ROUTES.SECRETARY.DASHBOARD} 
              icon="📊" 
              label="Dashboard"
              active={pathname === ROUTES.SECRETARY.DASHBOARD}
            />
            <NavItem 
              href={ROUTES.SECRETARY.APPOINTMENTS} 
              icon="📅" 
              label="Appointments"
              active={pathname === ROUTES.SECRETARY.APPOINTMENTS}
            />
            <NavItem 
              href={ROUTES.SECRETARY.DOCTORS} 
              icon="👨‍⚕️" 
              label="My Doctors"
              active={pathname === ROUTES.SECRETARY.DOCTORS}
            />
          </nav>

          <div className="p-4 border-t">
            <div className="mb-3 px-4 py-2 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="font-medium text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button className="md:hidden p-2 rounded-lg hover:bg-muted">
                <span className="text-xl">☰</span>
              </button>
              <h1 className="text-xl font-semibold">Secretary Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <span className="text-xl">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Secretary</p>
                </div>
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

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

