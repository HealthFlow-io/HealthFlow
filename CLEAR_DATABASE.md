# Clear Database Script

## WARNING: This will delete ALL data from your database!

This script helps you clear your HealthFlow database to allow reseeding.

## Option 1: Using Entity Framework (Recommended)

Drop and recreate the database:

```bash
cd Back/HealthFlow_backend/HealthFlow_backend

# Drop the entire database
dotnet ef database drop --force

# Recreate with migrations
dotnet ef database update

# Now you can seed
dotnet run seed
```

## Option 2: Using SQL

Run this SQL in your MySQL client:

```sql
USE healthflow_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables
DROP TABLE IF EXISTS `MedicalRecordAttachments`;
DROP TABLE IF EXISTS `MedicalRecords`;
DROP TABLE IF EXISTS `DoctorRatings`;
DROP TABLE IF EXISTS `Notifications`;
DROP TABLE IF EXISTS `SecretaryDoctors`;
DROP TABLE IF EXISTS `Appointments`;
DROP TABLE IF EXISTS `DoctorAvailabilities`;
DROP TABLE IF EXISTS `FileUploads`;
DROP TABLE IF EXISTS `Doctors`;
DROP TABLE IF EXISTS `SecretaryProfiles`;
DROP TABLE IF EXISTS `ClinicWorkingHours`;
DROP TABLE IF EXISTS `Clinics`;
DROP TABLE IF EXISTS `Specializations`;
DROP TABLE IF EXISTS `Users`;
DROP TABLE IF EXISTS `__EFMigrationsHistory`;

SET FOREIGN_KEY_CHECKS = 1;
```

Then run migrations and seed:

```bash
cd Back/HealthFlow_backend/HealthFlow_backend
dotnet ef database update
dotnet run seed
```

## Option 3: Truncate Tables Only (Keep Structure)

If you want to keep the table structure but remove data:

```sql
USE healthflow_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `MedicalRecordAttachments`;
TRUNCATE TABLE `MedicalRecords`;
TRUNCATE TABLE `DoctorRatings`;
TRUNCATE TABLE `Notifications`;
TRUNCATE TABLE `SecretaryDoctors`;
TRUNCATE TABLE `Appointments`;
TRUNCATE TABLE `DoctorAvailabilities`;
TRUNCATE TABLE `FileUploads`;
TRUNCATE TABLE `Doctors`;
TRUNCATE TABLE `SecretaryProfiles`;
TRUNCATE TABLE `ClinicWorkingHours`;
TRUNCATE TABLE `Clinics`;
TRUNCATE TABLE `Specializations`;
TRUNCATE TABLE `Users`;

SET FOREIGN_KEY_CHECKS = 1;
```

Then seed:

```bash
cd Back/HealthFlow_backend/HealthFlow_backend
dotnet run seed
```

## Quick Command (PowerShell)

```powershell
# One-liner to drop, migrate, and seed
cd D:\personal_work\github\HealthFlow\Back\HealthFlow_backend\HealthFlow_backend; dotnet ef database drop --force; dotnet ef database update; dotnet run seed
```

## After Clearing

Once you've cleared the database, run the seeder:

```bash
dotnet run seed
```

You should see output like:

```
🌱 Starting database seeding...
✓ Created 10 specializations
✓ Created 15 clinics
...
✅ Database seeding completed successfully!
```
