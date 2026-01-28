'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/lib/constants';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get store state and actions
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeLogin = useAuthStore((state) => state.login);

  // Redirect if already authenticated
  useEffect(() => {
    console.log({ isInitialized, isLoading, isAuthenticated, user });
    if (!isInitialized || isLoading) return;

    if (isAuthenticated && user) {
      console.log('[Login] Already authenticated, redirecting');
      // print all the changed values that function this use state
      const redirectPath = getRedirectPath(user.role, searchParams.get('redirect'));
      console.log('[Login] Redirecting to:', redirectPath);
      router.replace(redirectPath);
      // router.replace("/");
    }
  }, [isInitialized, isLoading, isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      await storeLogin({ email, password });
      
      // Get the updated user from store after login
      const updatedUser = useAuthStore.getState().user;
      console.log('[Login] Login successful:', updatedUser?.email);
      
      if (updatedUser) {
        const redirectPath = getRedirectPath(updatedUser.role, searchParams.get('redirect'));
        console.log('[Login] Redirecting to:', redirectPath);
        router.push(redirectPath);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const apiError = err as { message?: string; statusCode?: number };
      if (apiError.statusCode === 401) {
        setError('Invalid email or password');
      } else if (apiError.message) {
        setError(apiError.message);
      } else {
        setError('Login failed. Please check if the server is running.');
      }
      setIsSubmitting(false);
    }
  };

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show loading if authenticated (redirect pending)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-3xl">🏥</span>
            <span className="text-2xl font-bold text-primary">HealthFlow</span>
          </Link>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign In
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Helper to get redirect path based on role
function getRedirectPath(role: string, redirectParam: string | null): string {
  // if (redirectParam) return redirectParam;
  
  switch (role) {
    case UserRole.Doctor:
      return ROUTES.DOCTOR.DASHBOARD;
    case UserRole.Secretary:
      return ROUTES.SECRETARY.DASHBOARD;
    case UserRole.Admin:
      return ROUTES.ADMIN.DASHBOARD;
    default:
      return ROUTES.PATIENT.DASHBOARD;
  }
}
