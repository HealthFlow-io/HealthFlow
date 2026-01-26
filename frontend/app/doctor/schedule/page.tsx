'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { DAYS_OF_WEEK } from '@/lib/constants';

// Mock availability data
const mockAvailability = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
  { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 2, startTime: '14:00', endTime: '17:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 4, startTime: '14:00', endTime: '17:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
];

export default function DoctorSchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const getAvailabilityForDay = (day: number) => {
    return mockAvailability.filter((a) => a.dayOfWeek === day);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">My Schedule</h2>
          <p className="text-muted-foreground">Manage your weekly availability</p>
        </div>
        <Button>Save Changes</Button>
      </div>

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
            <Button size="sm">Add Time Slot</Button>
          </CardHeader>
          <CardContent>
            {getAvailabilityForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">😴</span>
                <p className="text-lg font-medium">No availability set</p>
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t set any working hours for this day
                </p>
                <Button>Add Working Hours</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getAvailabilityForDay(selectedDay).map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">🕐</span>
                      <div>
                        <p className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {calculateDuration(slot.startTime, slot.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consultation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Consultation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Consultation Duration</label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                <option value="15">15 minutes</option>
                <option value="30" selected>30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Buffer Time Between Appointments</label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10" selected>10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Consultation Types</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked className="rounded" />
                <span>Physical Consultation</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked className="rounded" />
                <span>Online Consultation</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Home Visit</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Advance Booking</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background md:w-1/2">
              <option value="7">Allow booking up to 1 week in advance</option>
              <option value="14" selected>Allow booking up to 2 weeks in advance</option>
              <option value="30">Allow booking up to 1 month in advance</option>
              <option value="60">Allow booking up to 2 months in advance</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateDuration(start: string, end: string): string {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const duration = endMinutes - startMinutes;
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours}h ${minutes}m`;
}
