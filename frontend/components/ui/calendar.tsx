'use client';

/**
 * Calendar Component
 * A simple date picker calendar for selecting dates
 */

import { useState } from 'react';
import { Button } from './button';

interface CalendarProps {
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
  className?: string;
}

export function Calendar({ value, onChange, minDate, maxDate, className = '' }: CalendarProps) {
  const selectedDate = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || (minDate ? new Date(minDate) : new Date())
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isDateDisabled = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];

    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    
    return false;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Format date as YYYY-MM-DD string directly to avoid timezone issues
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${monthStr}-${dayStr}`;
    
    onChange(dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`bg-background border rounded-lg p-4 shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="hover:bg-muted"
        >
          ←
        </Button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="hover:bg-muted"
        >
          →
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index}>
            {day === null ? (
              <div className="p-2" />
            ) : (
              <button
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isDateDisabled(day)}
                className={`
                  w-full aspect-square p-2 text-sm rounded-md transition-colors
                  ${isDateSelected(day)
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : isDateDisabled(day)
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : 'hover:bg-muted cursor-pointer'
                  }
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
