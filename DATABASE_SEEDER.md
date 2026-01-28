# Database Seeder

This document explains how to use the database seeder to populate your HealthFlow database with realistic test data.

## Overview

The seeder generates comprehensive test data using the **Bogus** library (Faker for .NET) to help you evaluate the application with a realistic dataset.

## What Gets Seeded

The seeder creates the following data:

- **10 Specializations** (Cardiology, Dermatology, Neurology, etc.)
- **15 Clinics** with realistic addresses and contact information
- **3 Admin Users**
- **200 Patient Users**
- **50 Doctor Users** with complete profiles
- **~400 Doctor Availabilities** (working hours for each doctor)
- **20 Secretary Users**
- **500 Appointments** (mix of pending, approved, completed, and cancelled)
- **~300 Medical Records** (for completed appointments)
- **100 File Uploads**
- **Medical Record Attachments** (linked to records)
- **150 Doctor Ratings**
- **300 Notifications**

## Default Credentials

All users are created with the same default password:

- **Password**: `password`
- **Password Hash**: `$2a$11$4YzUsadaUw4icsb1jgHB/eCHoV1/rRW8V61tWiv5.ncxGLGWVFybW`

## Usage

### Run the Seeder

```bash
cd Back/HealthFlow_backend/HealthFlow_backend
dotnet run seed
```

### What Happens

1. The seeder checks if data already exists
2. If the database is empty, it generates all test data
3. Progress is displayed for each entity type
4. A summary is shown at the end

### Output Example

```
🌱 Starting database seeding...

✓ Created 10 specializations
✓ Created 15 clinics
✓ Created 3 admin users
✓ Created 200 patient users
✓ Created 50 doctor users
✓ Created 50 doctor profiles
✓ Created 400 doctor availabilities
✓ Created 20 secretary users
✓ Created 0 secretary-doctor relationships
✓ Created 500 appointments
✓ Created 300 medical records
✓ Created 100 file uploads
✓ Created 120 medical record attachments
✓ Created 150 doctor ratings
✓ Updated doctor average ratings
✓ Created 300 notifications
✅ Database seeding completed successfully!

📊 Summary:
   - Users: 273
   - Doctors: 50
   - Patients: 200
   - Secretaries: 20
   - Clinics: 15
   - Specializations: 10
   - Appointments: 500
   - Medical Records: 300
   - Notifications: 300

🔐 Default password for all users: 'password'
```

## Important Notes

1. **One-Time Seed**: The seeder will not run if data already exists in the database
2. **Reset Database**: To re-seed, you need to drop and recreate the database or clear all tables
3. **Secretary-Doctor Relationships**: Currently skipped as it requires SecretaryProfile entities

## Sample Login Credentials

After seeding, you can log in with any generated user. Here are some examples:

**Admin User:**
- Check the database for admin emails
- Password: `password`

**Doctor User:**
- Check the database for doctor emails
- Password: `password`

**Patient User:**
- Check the database for patient emails
- Password: `password`

## Customization

To customize the seeding:

1. Open `Data/DatabaseSeeder.cs`
2. Modify the counts in the `SeedAsync` method:
   ```csharp
   var patientUsers = GenerateUsers(UserRole.Patient, 200); // Change 200 to desired count
   var appointments = GenerateAppointments(patientUsers, doctors, clinics, 500); // Change 500
   ```
3. Rebuild and run: `dotnet build && dotnet run seed`

## Troubleshooting

### "Database already seeded"
The seeder detected existing data. To re-seed:
```bash
# Drop all tables and run migrations
dotnet ef database drop --force
dotnet ef database update
dotnet run seed
```

### Build Errors
Ensure all packages are restored:
```bash
dotnet restore
dotnet build
```

## Performance

Seeding ~1500+ records typically takes **10-30 seconds** depending on your system and database performance.

## Development Tips

- Use seeded data to test pagination, filtering, and search features
- The variety of appointment statuses helps test different workflows
- Medical records with attachments demonstrate file upload functionality
- Doctor ratings provide data for ranking and review features
