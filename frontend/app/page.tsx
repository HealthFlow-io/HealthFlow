import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold text-primary">HealthFlow</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#specializations" className="text-muted-foreground hover:text-foreground transition-colors">
              Specializations
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your Health,{' '}
              <span className="text-primary">Simplified</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Book medical consultations with top doctors in minutes. 
              Choose between physical visits or online consultations via video call.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8">
                  Book Appointment
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Qualified Doctors</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Specializations</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">10k+</p>
                <p className="text-sm text-muted-foreground">Happy Patients</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Online Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose HealthFlow?</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🔍"
              title="Find the Right Doctor"
              description="Search by specialization, location, availability, and patient ratings to find your perfect match."
            />
            <FeatureCard
              icon="📅"
              title="Easy Booking"
              description="Book appointments in just a few clicks. Choose your preferred date, time, and consultation type."
            />
            <FeatureCard
              icon="💻"
              title="Online Consultations"
              description="Connect with doctors via secure video calls from the comfort of your home."
            />
            <FeatureCard
              icon="🔔"
              title="Real-time Updates"
              description="Get instant notifications about your appointment status and reminders."
            />
            <FeatureCard
              icon="📋"
              title="Medical History"
              description="Keep track of your consultations, prescriptions, and medical records in one place."
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              description="Your health data is protected with enterprise-grade security and encryption."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              step={1}
              title="Create Account"
              description="Sign up for free and complete your profile"
            />
            <StepCard
              step={2}
              title="Find a Doctor"
              description="Search and browse doctors by specialization"
            />
            <StepCard
              step={3}
              title="Book Appointment"
              description="Select your preferred time and consultation type"
            />
            <StepCard
              step={4}
              title="Get Consultation"
              description="Meet your doctor in person or via video call"
            />
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section id="specializations" className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Specializations</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              '🫀 Cardiology',
              '🧠 Neurology',
              '👁️ Ophthalmology',
              '🦴 Orthopedics',
              '🩺 General Medicine',
              '👶 Pediatrics',
              '🦷 Dentistry',
              '🧬 Dermatology',
              '💊 Psychiatry',
              '🏃 Physiotherapy',
              '👩‍⚕️ Gynecology',
              '🔬 Pathology',
            ].map((spec) => (
              <div
                key={spec}
                className="flex items-center justify-center p-4 bg-background rounded-lg border hover:border-primary transition-colors cursor-pointer"
              >
                <span className="text-lg font-medium">{spec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of patients who trust HealthFlow for their medical consultations.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4 mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🏥</span>
                <span className="text-xl font-bold text-primary">HealthFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Making healthcare accessible to everyone, everywhere.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Find a Doctor</Link></li>
                <li><Link href="#" className="hover:text-foreground">Book Appointment</Link></li>
                <li><Link href="#" className="hover:text-foreground">Online Consultation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Join as Doctor</Link></li>
                <li><Link href="#" className="hover:text-foreground">Manage Schedule</Link></li>
                <li><Link href="#" className="hover:text-foreground">Patient Management</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} HealthFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg border">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
