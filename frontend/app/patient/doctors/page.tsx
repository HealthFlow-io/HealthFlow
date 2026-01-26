'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input } from '@/components/ui';

// Mock data for doctors
const mockDoctors = [
  {
    id: '1',
    fullName: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    rating: 4.9,
    experienceYears: 15,
    consultationPrice: 150,
    languages: ['English', 'French'],
    consultationTypes: ['online', 'physical'],
    bio: 'Board-certified cardiologist with expertise in heart disease prevention and treatment.',
  },
  {
    id: '2',
    fullName: 'Dr. Michael Chen',
    specialization: 'General Medicine',
    rating: 4.8,
    experienceYears: 10,
    consultationPrice: 80,
    languages: ['English', 'Chinese'],
    consultationTypes: ['online', 'physical', 'home-visit'],
    bio: 'Experienced general practitioner focused on preventive care and patient wellness.',
  },
  {
    id: '3',
    fullName: 'Dr. Emily Williams',
    specialization: 'Dermatology',
    rating: 4.7,
    experienceYears: 8,
    consultationPrice: 120,
    languages: ['English'],
    consultationTypes: ['online', 'physical'],
    bio: 'Specializing in skin conditions, cosmetic dermatology, and laser treatments.',
  },
  {
    id: '4',
    fullName: 'Dr. Ahmed Hassan',
    specialization: 'Orthopedics',
    rating: 4.9,
    experienceYears: 20,
    consultationPrice: 180,
    languages: ['English', 'Arabic'],
    consultationTypes: ['physical'],
    bio: 'Expert orthopedic surgeon specializing in joint replacement and sports injuries.',
  },
];

const specializations = [
  'All Specializations',
  'Cardiology',
  'General Medicine',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
];

export default function FindDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [consultationType, setConsultationType] = useState<string>('all');

  const filteredDoctors = mockDoctors.filter((doctor) => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization =
      selectedSpecialization === 'All Specializations' ||
      doctor.specialization === selectedSpecialization;
    const matchesType =
      consultationType === 'all' || doctor.consultationTypes.includes(consultationType);

    return matchesSearch && matchesSpecialization && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Find a Doctor</h2>
        <p className="text-muted-foreground">Search and book appointments with qualified doctors</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Doctor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Specialization</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Consultation Type</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="physical">Physical</option>
                <option value="home-visit">Home Visit</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </p>

        {filteredDoctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}

        {filteredDoctors.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-lg font-medium">No doctors found</p>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: (typeof mockDoctors)[0] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">👨‍⚕️</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold">{doctor.fullName}</h3>
              <p className="text-primary font-medium">{doctor.specialization}</p>
            </div>

            <p className="text-muted-foreground text-sm">{doctor.bio}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span className="font-medium">{doctor.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎓</span>
                <span>{doctor.experienceYears} years exp.</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🌐</span>
                <span>{doctor.languages.join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {doctor.consultationTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-muted rounded text-xs font-medium capitalize"
                >
                  {type.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-right">
              <p className="text-2xl font-bold">${doctor.consultationPrice}</p>
              <p className="text-sm text-muted-foreground">per consultation</p>
            </div>
            <Button>Book Appointment</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
