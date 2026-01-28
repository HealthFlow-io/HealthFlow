-- ================================================
-- Quick Fix: Add Doctor Availability to MySQL Database
-- ================================================
-- This script adds a standard weekday schedule (9 AM - 5 PM) for all existing doctors

-- First, let's check existing doctors
SELECT Id, FullName, SpecializationId FROM Doctors;

-- ================================================
-- Option 1: Add availability for a SPECIFIC doctor
-- ================================================
-- Replace 'YOUR-DOCTOR-ID-HERE' with an actual doctor ID from the query above

SET @DoctorId = 'YOUR-DOCTOR-ID-HERE';

-- Monday (DayOfWeek = 1)
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (UUID(), @DoctorId, 1, '09:00:00', '12:00:00'),
    (UUID(), @DoctorId, 1, '14:00:00', '17:00:00');

-- Tuesday (DayOfWeek = 2)
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (UUID(), @DoctorId, 2, '09:00:00', '12:00:00'),
    (UUID(), @DoctorId, 2, '14:00:00', '17:00:00');

-- Wednesday (DayOfWeek = 3)
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (UUID(), @DoctorId, 3, '09:00:00', '12:00:00'),
    (UUID(), @DoctorId, 3, '14:00:00', '17:00:00');

-- Thursday (DayOfWeek = 4)
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (UUID(), @DoctorId, 4, '09:00:00', '12:00:00'),
    (UUID(), @DoctorId, 4, '14:00:00', '17:00:00');

-- Friday (DayOfWeek = 5)
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
VALUES 
    (UUID(), @DoctorId, 5, '09:00:00', '12:00:00'),
    (UUID(), @DoctorId, 5, '14:00:00', '17:00:00');

-- ================================================
-- Option 2: Add availability for ALL doctors at once
-- ================================================
-- This creates a standard schedule for every doctor

-- Delete existing availabilities (if any)
-- DELETE FROM DoctorAvailabilities;

-- Add standard weekday schedule for all doctors
INSERT INTO DoctorAvailabilities (Id, DoctorId, DayOfWeek, StartTime, EndTime)
SELECT UUID(), d.Id, 1, '09:00:00', '12:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 1, '14:00:00', '17:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 2, '09:00:00', '12:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 2, '14:00:00', '17:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 3, '09:00:00', '12:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 3, '14:00:00', '17:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 4, '09:00:00', '12:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 4, '14:00:00', '17:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 5, '09:00:00', '12:00:00' FROM Doctors d
UNION ALL
SELECT UUID(), d.Id, 5, '14:00:00', '17:00:00' FROM Doctors d;

-- ================================================
-- Verify the data was inserted
-- ================================================
SELECT 
    da.Id,
    d.FullName as DoctorName,
    da.DayOfWeek,
    CASE da.DayOfWeek
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as DayName,
    da.StartTime,
    da.EndTime
FROM DoctorAvailabilities da
INNER JOIN Doctors d ON da.DoctorId = d.Id
ORDER BY d.FullName, da.DayOfWeek, da.StartTime;

-- ================================================
-- IMPORTANT NOTES:
-- ================================================
-- - DayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
-- - Time format is 'HH:MM:SS' (24-hour format)
-- - Each doctor can have multiple time slots per day (e.g., morning and afternoon)
-- - The backend will divide these slots based on the doctor's ConsultationDuration
