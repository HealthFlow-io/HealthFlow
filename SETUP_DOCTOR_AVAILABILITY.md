# Setting Up Doctor Availability

## Problem
The doctor availability table is empty, which means no time slots show up when patients try to book appointments.

## Solution Options

### Option 1: Doctors Set Their Own Schedule (Recommended)
Have each doctor log in and set their availability:

1. **Login as a Doctor** (if you don't have a doctor account, create one through admin)
2. Navigate to **Doctor Dashboard** → **Schedule** (http://localhost:3000/doctor/schedule)
3. Use the **Quick Setup** buttons to set up a standard schedule:
   - **Standard Weekdays (9-5)**: Sets up 9 AM - 12 PM and 2 PM - 5 PM for Monday-Friday
   - **Morning Only**: 8 AM - 1 PM for weekdays
   - **Afternoon Only**: 1 PM - 6 PM for weekdays
4. Or manually add time slots for each day:
   - Click on a day of the week
   - Click "Add Time Slot"
   - Set start and end times
5. Click **Save Changes**

### Option 2: Add Seed Data to Backend (For Development/Testing)

Add this code to `ApplicationDbContext.cs` in the `SeedData` method:

```csharp
// Seed Doctor Availabilities (Add this after seeding specializations)
// Assuming you have a doctor with a known ID, replace with actual doctor ID
var doctorId = Guid.Parse("YOUR-DOCTOR-ID-HERE");

modelBuilder.Entity<DoctorAvailability>().HasData(
    // Monday
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Monday, 
        StartTime = new TimeSpan(9, 0, 0), 
        EndTime = new TimeSpan(12, 0, 0) 
    },
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Monday, 
        StartTime = new TimeSpan(14, 0, 0), 
        EndTime = new TimeSpan(17, 0, 0) 
    },
    // Tuesday
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Tuesday, 
        StartTime = new TimeSpan(9, 0, 0), 
        EndTime = new TimeSpan(12, 0, 0) 
    },
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Tuesday, 
        StartTime = new TimeSpan(14, 0, 0), 
        EndTime = new TimeSpan(17, 0, 0) 
    },
    // Wednesday
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Wednesday, 
        StartTime = new TimeSpan(9, 0, 0), 
        EndTime = new TimeSpan(12, 0, 0) 
    },
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Wednesday, 
        StartTime = new TimeSpan(14, 0, 0), 
        EndTime = new TimeSpan(17, 0, 0) 
    },
    // Thursday
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Thursday, 
        StartTime = new TimeSpan(9, 0, 0), 
        EndTime = new TimeSpan(12, 0, 0) 
    },
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Thursday, 
        StartTime = new TimeSpan(14, 0, 0), 
        EndTime = new TimeSpan(17, 0, 0) 
    },
    // Friday
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Friday, 
        StartTime = new TimeSpan(9, 0, 0), 
        EndTime = new TimeSpan(12, 0, 0) 
    },
    new DoctorAvailability { 
        Id = Guid.NewGuid(), 
        DoctorId = doctorId, 
        DayOfWeek = DayOfWeek.Friday, 
        StartTime = new TimeSpan(14, 0, 0), 
        EndTime = new TimeSpan(17, 0, 0) 
    }
);
```

Then run:
```bash
dotnet ef migrations add AddDoctorAvailabilitySeedData
dotnet ef database update
```

### Option 3: Direct Database Insert (Quick Fix for Testing)

If you want to quickly test, you can insert availability directly into the database:

```sql
-- Replace 'YOUR-DOCTOR-ID' with an actual doctor ID from your Doctors table
DECLARE @DoctorId UNIQUEIDENTIFIER = 'YOUR-DOCTOR-ID';

-- Monday
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (NEWID(), @DoctorId, 1, '09:00', '12:00'),
    (NEWID(), @DoctorId, 1, '14:00', '17:00');

-- Tuesday
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (NEWID(), @DoctorId, 2, '09:00', '12:00'),
    (NEWID(), @DoctorId, 2, '14:00', '17:00');

-- Wednesday
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (NEWID(), @DoctorId, 3, '09:00', '12:00'),
    (NEWID(), @DoctorId, 3, '14:00', '17:00');

-- Thursday
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (NEWID(), @DoctorId, 4, '09:00', '12:00'),
    (NEWID(), @DoctorId, 4, '14:00', '17:00');

-- Friday
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (NEWID(), @DoctorId, 5, '09:00', '12:00'),
    (NEWID(), @DoctorId, 5, '14:00', '17:00');
```

## Verification

After setting up availability:

1. Go to the patient doctors page: http://localhost:3000/patient/doctors
2. Click "Book Now" on a doctor
3. Select a date (choose a weekday like Monday-Friday)
4. You should now see available time slots!

## Notes

- Each doctor needs to set their own availability
- The system uses the doctor's `ConsultationDuration` field to divide the available time into slots
- Only slots that aren't already booked will show as available
- The day of week follows: Sunday=0, Monday=1, Tuesday=2, etc.
