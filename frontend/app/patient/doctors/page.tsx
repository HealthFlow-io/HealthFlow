'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Calendar } from '@/components/ui';
import { Doctor, Specialization, TimeSlot, AppointmentType } from '@/types';
import { doctorService, specializationService, appointmentService } from '@/services';
import { useAuthStore } from '@/store';
import { useDebounce } from '@/hooks';

export default function FindDoctorsPage() {
  const user = useAuthStore((state) => state.user);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [consultationType, setConsultationType] = useState<string>('all');

  // Booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(AppointmentType.Physical);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [debouncedSearch, selectedSpecialization]);

  const loadInitialData = async () => {
    try {
      const specs = await specializationService.getAll();
      setSpecializations(specs);
    } catch (err) {
      console.error('Failed to load specializations:', err);
    }
  };

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedSpecialization) params.specializationId = selectedSpecialization;
      
      const response = await doctorService.getAll(params);
      setDoctors(response.data || response as unknown as Doctor[]);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    try {
      setIsLoadingSlots(true);
      console.log('🔍 Loading slots for doctor:', doctorId, 'date:', date);
      const slots = await appointmentService.getAvailableSlots(doctorId, date);
      console.log('📊 Received slots from backend:', slots);
      console.log('✅ Available slots count:', slots.filter(s => s.isAvailable).length);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('❌ Failed to load slots:', err);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    
    if (selectedDateObj < today) {
      setError('Cannot select a date in the past');
      return;
    }
    
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowCalendar(false);
    setError(''); // Clear any previous errors
    
    if (selectedDoctor && date) {
      loadAvailableSlots(selectedDoctor.id, date);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot || !selectedDate || !user) return;

    try {
      setIsBooking(true);
      // Note: patientId is NOT in the DTO - it's obtained from auth context on backend
      await appointmentService.create({
        doctorId: selectedDoctor.id,
        clinicId: selectedDoctor.clinicId || undefined,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type: appointmentType,  // Use 'type' not 'appointmentType' - matches backend DTO
        reason: appointmentReason || undefined,
      });
      setBookingSuccess(true);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAppointmentReason('');
    setBookingSuccess(false);
    setShowCalendar(false);
    setError('');
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (consultationType === 'all') return true;
    // Filter by consultation type if the doctor has that capability
    return doctor.consultationTypes?.includes(consultationType as unknown as import('@/types').ConsultationType) ?? true;
  });

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

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
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Consultation Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="physical">In-Person</option>
                <option value="home-visit">Home Visit</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadDoctors} className="w-full">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <p className="text-muted-foreground">
            {filteredDoctors.length} doctor(s) found
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <span className="text-4xl block mb-4">👨‍⚕️</span>
                <p className="text-lg font-medium">No doctors found</p>
                <p>Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBookClick={() => setSelectedDoctor(doctor)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <Card className="w-full max-w-2xl mx-4">
            <CardContent className="pt-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <span className="text-6xl block mb-4">✅</span>
                  <h3 className="text-xl font-bold mb-2">Appointment Booked!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your appointment with Dr. {selectedDoctor.fullName || `${selectedDoctor.firstName || ''} ${selectedDoctor.lastName || ''}`.trim() || selectedDoctor.user?.firstName + ' ' + selectedDoctor.user?.lastName} has been requested.
                    You will receive a confirmation once the doctor approves.
                  </p>
                  <Button onClick={closeBookingModal}>Close</Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">Book Appointment</h3>
                      <div className="mt-2 space-y-1">
                        <p className="font-semibold text-lg">
                          Dr. {selectedDoctor.fullName || `${selectedDoctor.firstName || selectedDoctor.user?.firstName || ''} ${selectedDoctor.lastName || selectedDoctor.user?.lastName || ''}`.trim()}
                        </p>
                        <p className="text-primary text-sm">
                          {selectedDoctor.specialization?.name || 'General Medicine'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                          {(selectedDoctor.yearsOfExperience || selectedDoctor.experienceYears) && (
                            <span>💼 {selectedDoctor.yearsOfExperience || selectedDoctor.experienceYears} years</span>
                          )}
                          {selectedDoctor.consultationDuration && (
                            <span>⏱️ {selectedDoctor.consultationDuration} min</span>
                          )}
                          <span className="font-semibold text-primary">
                            ${(selectedDoctor.consultationFee || selectedDoctor.consultationPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={closeBookingModal} className="text-2xl hover:opacity-70 ml-4">
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Date</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="w-full px-3 py-2 border rounded-md bg-background text-left flex items-center justify-between"
                        >
                          <span className={selectedDate ? '' : 'text-muted-foreground'}>
                            {selectedDate ? (() => {
                              // Parse date correctly to avoid timezone issues
                              const [year, month, day] = selectedDate.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('en-US', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })() : 'Click to select a date'}
                          </span>
                          <span className="text-xl">📅</span>
                        </button>
                        
                        {showCalendar && (
                          <div className="absolute top-full left-0 right-0 mt-2 z-50">
                            <Calendar
                              value={selectedDate}
                              onChange={handleDateChange}
                              minDate={getMinDate()}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Select a date to see available time slots for that day
                      </p>
                    </div>

                    {selectedDate && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Available Times</label>
                        {isLoadingSlots ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-6 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">
                              😔 No available slots for this date
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              The doctor may not be available on this day or all slots are booked
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-muted/20 rounded-lg">
                              {availableSlots
                                .filter(slot => slot.isAvailable)
                                .map((slot, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 text-sm rounded-md border transition-all ${
                                      selectedSlot?.startTime === slot.startTime
                                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                        : 'hover:bg-muted hover:border-primary/50'
                                    }`}
                                  >
                                    {slot.startTime}
                                  </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              ✓ Showing {availableSlots.filter(s => s.isAvailable).length} available slot(s)
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {selectedSlot && (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Appointment Type</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAppointmentType(AppointmentType.Physical)}
                              className={`flex-1 p-3 rounded-md border ${
                                appointmentType === AppointmentType.Physical
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              🏥 In-Person
                            </button>
                            <button
                              onClick={() => setAppointmentType(AppointmentType.Online)}
                              className={`flex-1 p-3 rounded-md border ${
                                appointmentType === AppointmentType.Online
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              💻 Online
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Reason for Visit</label>
                          <textarea
                            className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                            rows={3}
                            value={appointmentReason}
                            onChange={(e) => setAppointmentReason(e.target.value)}
                            placeholder="Describe your symptoms or reason for the appointment..."
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" onClick={closeBookingModal} className="flex-1">
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleBookAppointment} 
                            className="flex-1"
                            isLoading={isBooking}
                          >
                            Confirm Booking
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  onBookClick: () => void;
}

function DoctorCard({ doctor, onBookClick }: DoctorCardProps) {
  // Map backend field names to frontend - handle all possible field name variations
  const firstName = doctor.firstName || doctor.user?.firstName || '';
  const lastName = doctor.lastName || doctor.user?.lastName || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : (doctor.fullName || 'Unknown');
  const yearsOfExp = doctor.yearsOfExperience || doctor.experienceYears || 0;
  const fee = doctor.consultationFee || doctor.consultationPrice || 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                Dr. {displayName}
              </h3>
              <p className="text-primary text-sm font-medium">
                {doctor.specialization?.name || 'General Medicine'}
              </p>
              {doctor.subSpecializations && doctor.subSpecializations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {doctor.subSpecializations.join(', ')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {doctor.rating && doctor.rating > 0 && (
                <span className="flex items-center gap-1">
                  ⭐ {doctor.rating.toFixed(1)}
                </span>
              )}
              {yearsOfExp > 0 && (
                <span className="flex items-center gap-1">
                  💼 {yearsOfExp} years exp
                </span>
              )}
              {doctor.consultationDuration && (
                <span className="flex items-center gap-1">
                  ⏱️ {doctor.consultationDuration} min
                </span>
              )}
            </div>

            {doctor.languages && doctor.languages.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">🌐 Languages: </span>
                <span>{doctor.languages.join(', ')}</span>
              </div>
            )}

            {doctor.consultationTypes && doctor.consultationTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doctor.consultationTypes.map((type, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                  >
                    {type === 'online' ? '💻 Online' : type === 'physical' ? '🏥 In-Person' : '🏠 Home Visit'}
                  </span>
                ))}
              </div>
            )}

            {doctor.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {doctor.bio}
              </p>
            )}

            {doctor.education && (
              <p className="text-xs text-muted-foreground">
                🎓 {doctor.education}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold text-primary text-lg">
                ${fee > 0 ? fee.toFixed(2) : 'N/A'}
              </span>
              <Button size="sm" onClick={onBookClick}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
