'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuthStore } from '@/store';
import { doctorService } from '@/services';
import { DoctorAvailability } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function DoctorSchedulePage() {
  const user = useAuthStore((state) => state.user);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDoctorProfile();
    }
  }, [user?.id]);

  const loadDoctorProfile = async () => {
    try {
      setIsLoading(true);
      // Fetch all doctors and find the one matching current user
      const response = await doctorService.getAll({});
      const doctors = response.data || response;
      const currentDoctor = Array.isArray(doctors) 
        ? doctors.find((d: any) => d.userId === user!.id)
        : null;
      
      if (currentDoctor) {
        setDoctorId(currentDoctor.id);
        await loadAvailability(currentDoctor.id);
      } else {
        setError('Doctor profile not found. Please contact support.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load doctor profile:', err);
      setError('Failed to load doctor profile');
      setIsLoading(false);
    }
  };

  const loadAvailability = async (doctorIdParam: string) => {
    try {
      const data = await doctorService.getAvailability(doctorIdParam);
      setAvailability(data.map((a: DoctorAvailability) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })));
    } catch (err) {
      console.error('Failed to load availability:', err);
      // Initialize with empty availability if not found
      setAvailability([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doctorId) {
      setError('Doctor profile not found');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      await doctorService.updateAvailability(doctorId, availability.map(a => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })));
      setSuccess('Schedule saved successfully!');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const addSlot = (dayOfWeek: number) => {
    setAvailability([
      ...availability,
      { dayOfWeek, startTime: '09:00', endTime: '12:00' }
    ]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    const newAvailability = [...availability];
    newAvailability.splice(index, 1);
    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const updateSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newAvailability = [...availability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const getAvailabilityForDay = (day: number) => {
    return availability
      .map((a, index) => ({ ...a, index }))
      .filter(a => a.dayOfWeek === day);
  };

  const copyToNextDay = (sourceDay: number) => {
    const nextDay = (sourceDay + 1) % 7;
    const sourceDaySlots = availability.filter(a => a.dayOfWeek === sourceDay);
    const newSlots = sourceDaySlots.map(slot => ({
      ...slot,
      id: undefined,
      dayOfWeek: nextDay,
    }));
    setAvailability([...availability, ...newSlots]);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">My Schedule</h2>
          <p className="text-muted-foreground">Manage your weekly availability</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md">
          {success}
        </div>
      )}

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const slots = getAvailabilityForDay(day.value);
              const hasSlots = slots.length > 0;

              return (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    selectedDay === day.value
                      ? 'border-primary bg-primary/10'
                      : hasSlots
                      ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-dashed hover:border-primary'
                  }`}
                >
                  <p className="font-medium text-sm">{day.label.slice(0, 3)}</p>
                  {hasSlots ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {slots.length} slot{slots.length !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Off</p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details */}
      {selectedDay !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label} Schedule
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToNextDay(selectedDay)}
                disabled={getAvailabilityForDay(selectedDay).length === 0}
              >
                Copy to Next Day
              </Button>
              <Button variant="outline" size="sm" onClick={() => addSlot(selectedDay)}>
                + Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAvailabilityForDay(selectedDay).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No availability set for this day</p>
                  <Button onClick={() => addSlot(selectedDay)}>
                    Add Time Slot
                  </Button>
                </div>
              ) : (
                getAvailabilityForDay(selectedDay).map((slot) => (
                  <div key={slot.index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">Start Time</label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-1">End Time</label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(slot.index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      🗑️ Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use these templates to quickly set up common schedules
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Standard 9-5 weekdays
                const newAvailability: AvailabilitySlot[] = [];
                [1, 2, 3, 4, 5].forEach(day => {
                  newAvailability.push(
                    { dayOfWeek: day, startTime: '09:00', endTime: '12:00' },
                    { dayOfWeek: day, startTime: '14:00', endTime: '17:00' }
                  );
                });
                setAvailability(newAvailability);
                setHasChanges(true);
              }}
            >
              Standard Weekdays (9-5)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Morning only weekdays
                const newAvailability: AvailabilitySlot[] = [];
                [1, 2, 3, 4, 5].forEach(day => {
                  newAvailability.push(
                    { dayOfWeek: day, startTime: '08:00', endTime: '13:00' }
                  );
                });
                setAvailability(newAvailability);
                setHasChanges(true);
              }}
            >
              Morning Only
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Afternoon only weekdays
                const newAvailability: AvailabilitySlot[] = [];
                [1, 2, 3, 4, 5].forEach(day => {
                  newAvailability.push(
                    { dayOfWeek: day, startTime: '13:00', endTime: '18:00' }
                  );
                });
                setAvailability(newAvailability);
                setHasChanges(true);
              }}
            >
              Afternoon Only
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm('This will clear all your availability. Continue?')) {
                  setAvailability([]);
                  setHasChanges(true);
                }
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
