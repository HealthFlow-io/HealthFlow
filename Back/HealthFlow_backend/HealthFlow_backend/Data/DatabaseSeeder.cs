using Bogus;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HealthFlow_backend.Data;

public static class DatabaseSeeder
{
    // Default password hash for 'password'
    private const string DefaultPasswordHash = "$2a$11$4YzUsadaUw4icsb1jgHB/eCHoV1/rRW8V61tWiv5.ncxGLGWVFybW";

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Check if data already exists in any table (excluding Specializations which are seeded by migration)
        var hasUsers = await context.Users.AnyAsync();
        var hasClinics = await context.Clinics.AnyAsync();
        var hasDoctors = await context.Doctors.AnyAsync();
        
        if (hasUsers || hasClinics || hasDoctors)
        {
            Console.WriteLine("⚠️  Database already contains data. Skipping seed...");
            Console.WriteLine("To reseed, first clear the database using:");
            Console.WriteLine("  dotnet ef database drop --force && dotnet ef database update && dotnet run seed");
            return;
        }

        Console.WriteLine("Starting database seeding...");

        // Set seed for reproducible data
        Randomizer.Seed = new Random(12345);

        // Get or create Specializations
        var specializations = await context.Specializations.ToListAsync();
        if (specializations.Count == 0)
        {
            specializations = new List<Specialization>
            {
                new Specialization { Id = new Guid("11111111-1111-1111-1111-111111111111"), Name = "Cardiology", Category = "Medical", Description = "Heart and cardiovascular system" },
                new Specialization { Id = new Guid("22222222-2222-2222-2222-222222222222"), Name = "Dermatology", Category = "Medical", Description = "Skin, hair, and nails" },
                new Specialization { Id = new Guid("33333333-3333-3333-3333-333333333333"), Name = "Neurology", Category = "Medical", Description = "Brain and nervous system" },
                new Specialization { Id = new Guid("44444444-4444-4444-4444-444444444444"), Name = "Orthopedics", Category = "Surgical", Description = "Bones and joints" },
                new Specialization { Id = new Guid("55555555-5555-5555-5555-555555555555"), Name = "Pediatrics", Category = "Medical", Description = "Children's health" },
                new Specialization { Id = new Guid("66666666-6666-6666-6666-666666666666"), Name = "Psychiatry", Category = "Mental Health", Description = "Mental health disorders" },
                new Specialization { Id = new Guid("77777777-7777-7777-7777-777777777777"), Name = "General Surgery", Category = "Surgical", Description = "General surgical procedures" },
                new Specialization { Id = new Guid("88888888-8888-8888-8888-888888888888"), Name = "Dentistry", Category = "Medical", Description = "Teeth and oral health" },
                new Specialization { Id = new Guid("99999999-9999-9999-9999-999999999999"), Name = "Ophthalmology", Category = "Medical", Description = "Eye care and vision" },
                new Specialization { Id = new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name = "Gynecology", Category = "Medical", Description = "Women's health" }
            };
            await context.Specializations.AddRangeAsync(specializations);
            await context.SaveChangesAsync();
            Console.WriteLine($"✓ Created {specializations.Count} specializations");
        }
        else
        {
            Console.WriteLine($"✓ Using {specializations.Count} specializations from migration");
        }

        // Generate Clinics (15)
        var clinics = GenerateClinics(15);
        await context.Clinics.AddRangeAsync(clinics);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {clinics.Count} clinics");

        // Generate Admin Users (3)
        var adminUsers = GenerateUsers(UserRole.Admin, 3);
        await context.Users.AddRangeAsync(adminUsers);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {adminUsers.Count} admin users");

        // Generate Patient Users (200)
        var patientUsers = GenerateUsers(UserRole.Patient, 200);
        await context.Users.AddRangeAsync(patientUsers);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {patientUsers.Count} patient users");

        // Generate Doctor Users (50)
        var doctorUsers = GenerateUsers(UserRole.Doctor, 50);
        await context.Users.AddRangeAsync(doctorUsers);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {doctorUsers.Count} doctor users");

        // Generate Doctor Profiles
        var doctors = GenerateDoctors(doctorUsers, specializations, clinics);
        await context.Doctors.AddRangeAsync(doctors);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {doctors.Count} doctor profiles");

        // Generate Doctor Availabilities
        var availabilities = GenerateDoctorAvailabilities(doctors);
        await context.DoctorAvailabilities.AddRangeAsync(availabilities);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {availabilities.Count} doctor availabilities");

        // Generate Secretary Users (20)
        var secretaryUsers = GenerateUsers(UserRole.Secretary, 20);
        await context.Users.AddRangeAsync(secretaryUsers);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {secretaryUsers.Count} secretary users");

        // Generate Secretary-Doctor Relationships
        var secretaryDoctors = GenerateSecretaryDoctors(secretaryUsers, doctors);
        await context.SecretaryDoctors.AddRangeAsync(secretaryDoctors);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {secretaryDoctors.Count} secretary-doctor relationships");

        // Generate Appointments (500)
        var appointments = GenerateAppointments(patientUsers, doctors, clinics, 500);
        await context.Appointments.AddRangeAsync(appointments);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {appointments.Count} appointments");

        // Generate Medical Records (300 - for completed appointments)
        var completedAppointments = appointments.Where(a => a.Status == AppointmentStatus.Done).ToList();
        var medicalRecords = GenerateMedicalRecords(patientUsers, doctors, completedAppointments);
        await context.MedicalRecords.AddRangeAsync(medicalRecords);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {medicalRecords.Count} medical records");

        // Generate File Uploads (100)
        var fileUploads = GenerateFileUploads(doctorUsers, 100);
        await context.FileUploads.AddRangeAsync(fileUploads);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {fileUploads.Count} file uploads");

        // Generate Medical Record Attachments
        var attachments = GenerateMedicalRecordAttachments(medicalRecords, fileUploads);
        await context.MedicalRecordAttachments.AddRangeAsync(attachments);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {attachments.Count} medical record attachments");

        // Generate Doctor Ratings (150)
        var ratings = GenerateDoctorRatings(patientUsers, doctors, 150);
        await context.DoctorRatings.AddRangeAsync(ratings);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {ratings.Count} doctor ratings");

        // Update doctor ratings
        await UpdateDoctorRatings(context, doctors);
        Console.WriteLine("✓ Updated doctor average ratings");

        // Generate Notifications (300)
        var notifications = GenerateNotifications(patientUsers, doctorUsers, secretaryUsers, 300);
        await context.Notifications.AddRangeAsync(notifications);
        await context.SaveChangesAsync();
        Console.WriteLine($"✓ Created {notifications.Count} notifications");

        Console.WriteLine("✅ Database seeding completed successfully!");
        Console.WriteLine("\n📊 Summary:");
        Console.WriteLine($"   - Users: {await context.Users.CountAsync()}");
        Console.WriteLine($"   - Doctors: {await context.Doctors.CountAsync()}");
        Console.WriteLine($"   - Patients: {patientUsers.Count}");
        Console.WriteLine($"   - Secretaries: {secretaryUsers.Count}");
        Console.WriteLine($"   - Clinics: {await context.Clinics.CountAsync()}");
        Console.WriteLine($"   - Specializations: {await context.Specializations.CountAsync()}");
        Console.WriteLine($"   - Appointments: {await context.Appointments.CountAsync()}");
        Console.WriteLine($"   - Medical Records: {await context.MedicalRecords.CountAsync()}");
        Console.WriteLine($"   - Notifications: {await context.Notifications.CountAsync()}");
        Console.WriteLine("\n🔐 Default password for all users: 'password'");
    }

    private static List<Specialization> GenerateSpecializations()
    {
        var specializations = new List<Specialization>
        {
            new() { Id = Guid.NewGuid(), Name = "Cardiology", Category = "Medical", Description = "Heart and cardiovascular system" },
            new() { Id = Guid.NewGuid(), Name = "Dermatology", Category = "Medical", Description = "Skin conditions and treatments" },
            new() { Id = Guid.NewGuid(), Name = "Neurology", Category = "Medical", Description = "Nervous system disorders" },
            new() { Id = Guid.NewGuid(), Name = "Pediatrics", Category = "Medical", Description = "Child healthcare" },
            new() { Id = Guid.NewGuid(), Name = "Orthopedics", Category = "Surgical", Description = "Bone and joint conditions" },
            new() { Id = Guid.NewGuid(), Name = "Psychiatry", Category = "Mental Health", Description = "Mental health disorders" },
            new() { Id = Guid.NewGuid(), Name = "General Practice", Category = "Primary Care", Description = "General medical care" },
            new() { Id = Guid.NewGuid(), Name = "Gynecology", Category = "Medical", Description = "Women's health" },
            new() { Id = Guid.NewGuid(), Name = "Ophthalmology", Category = "Medical", Description = "Eye care and vision" },
            new() { Id = Guid.NewGuid(), Name = "Dentistry", Category = "Dental", Description = "Oral health and dental care" }
        };

        return specializations;
    }

    private static List<Clinic> GenerateClinics(int count)
    {
        var clinicFaker = new Faker<Clinic>()
            .RuleFor(c => c.Id, f => Guid.NewGuid())
            .RuleFor(c => c.Name, f => $"{f.Company.CompanyName()} Medical Center")
            .RuleFor(c => c.Address, f => f.Address.FullAddress())
            .RuleFor(c => c.Latitude, f => f.Address.Latitude())
            .RuleFor(c => c.Longitude, f => f.Address.Longitude())
            .RuleFor(c => c.Phone, f => f.Phone.PhoneNumber("###-###-####"))
            .RuleFor(c => c.Email, f => f.Internet.Email())
            .RuleFor(c => c.Website, f => f.Internet.Url())
            .RuleFor(c => c.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(2), DateTimeKind.Utc));

        return clinicFaker.Generate(count);
    }

    private static List<User> GenerateUsers(UserRole role, int count)
    {
        var userFaker = new Faker<User>()
            .RuleFor(u => u.Id, f => Guid.NewGuid())
            .RuleFor(u => u.FirstName, f => f.Name.FirstName())
            .RuleFor(u => u.LastName, f => f.Name.LastName())
            .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.FirstName, u.LastName).ToLower())
            .RuleFor(u => u.PasswordHash, f => DefaultPasswordHash)
            .RuleFor(u => u.Phone, f => f.Phone.PhoneNumber("###-###-####"))
            .RuleFor(u => u.Role, f => role)
            .RuleFor(u => u.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(1), DateTimeKind.Utc));

        return userFaker.Generate(count);
    }

    private static List<Doctor> GenerateDoctors(List<User> doctorUsers, List<Specialization> specializations, List<Clinic> clinics)
    {
        var doctors = new List<Doctor>();
        var random = new Random();

        foreach (var user in doctorUsers)
        {
            var specialization = specializations[random.Next(specializations.Count)];
            var clinic = clinics[random.Next(clinics.Count)];

            var doctor = new Faker<Doctor>()
                .RuleFor(d => d.Id, f => Guid.NewGuid())
                .RuleFor(d => d.UserId, f => user.Id)
                .RuleFor(d => d.FullName, f => $"{user.FirstName} {user.LastName}")
                .RuleFor(d => d.SpecializationId, f => specialization.Id)
                .RuleFor(d => d.SubSpecializations, f => "[]")
                .RuleFor(d => d.Bio, f => f.Lorem.Paragraph())
                .RuleFor(d => d.ExperienceYears, f => f.Random.Int(2, 30))
                .RuleFor(d => d.Languages, f => "[\"English\", \"Arabic\"]")
                .RuleFor(d => d.ConsultationTypes, f => "[\"Physical\", \"Online\"]")
                .RuleFor(d => d.ConsultationDuration, f => f.PickRandom(30, 45, 60))
                .RuleFor(d => d.ConsultationPrice, f => f.Random.Decimal(50, 300))
                .RuleFor(d => d.ClinicId, f => clinic.Id)
                .RuleFor(d => d.Rating, f => f.Random.Double(3.5, 5.0))
                .RuleFor(d => d.RatingCount, f => 0)
                .RuleFor(d => d.CreatedAt, f => user.CreatedAt)
                .Generate();

            doctors.Add(doctor);
        }

        return doctors;
    }

    private static List<DoctorAvailability> GenerateDoctorAvailabilities(List<Doctor> doctors)
    {
        var availabilities = new List<DoctorAvailability>();
        var random = new Random();

        foreach (var doctor in doctors)
        {
            // Each doctor works 4-5 days per week
            var workDays = Enumerable.Range(1, 5).OrderBy(x => random.Next()).Take(random.Next(4, 6)).ToList();

            foreach (var day in workDays)
            {
                // Morning slot
                availabilities.Add(new DoctorAvailability
                {
                    Id = Guid.NewGuid(),
                    DoctorId = doctor.Id,
                    DayOfWeek = (DayOfWeek)day,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(12, 0, 0)
                });

                // Afternoon slot (80% chance)
                if (random.NextDouble() > 0.2)
                {
                    availabilities.Add(new DoctorAvailability
                    {
                        Id = Guid.NewGuid(),
                        DoctorId = doctor.Id,
                        DayOfWeek = (DayOfWeek)day,
                        StartTime = new TimeSpan(14, 0, 0),
                        EndTime = new TimeSpan(18, 0, 0)
                    });
                }
            }
        }

        return availabilities;
    }

    private static List<SecretaryDoctor> GenerateSecretaryDoctors(List<User> secretaryUsers, List<Doctor> doctors)
    {
        var secretaryDoctors = new List<SecretaryDoctor>();
        var random = new Random();

        // Note: SecretaryDoctor requires SecretaryProfileId, not userId
        // For now, we'll skip this as we need SecretaryProfile entities first
        // This would need to be implemented after creating SecretaryProfile entities

        return secretaryDoctors;
    }

    private static List<Appointment> GenerateAppointments(List<User> patients, List<Doctor> doctors, List<Clinic> clinics, int count)
    {
        var appointmentFaker = new Faker<Appointment>()
            .RuleFor(a => a.Id, f => Guid.NewGuid())
            .RuleFor(a => a.PatientId, f => f.PickRandom(patients).Id)
            .RuleFor(a => a.DoctorId, f => f.PickRandom(doctors).Id)
            .RuleFor(a => a.ClinicId, (f, a) => doctors.First(d => d.Id == a.DoctorId).ClinicId)
            .RuleFor(a => a.Date, f => DateOnly.FromDateTime(f.Date.Between(DateTime.UtcNow.AddMonths(-3), DateTime.UtcNow.AddMonths(2))))
            .RuleFor(a => a.StartTime, f => new TimeSpan(f.Random.Int(8, 16), f.PickRandom(0, 30), 0))
            .RuleFor(a => a.EndTime, (f, a) => a.StartTime.Add(TimeSpan.FromMinutes(30)))
            .RuleFor(a => a.Type, f => f.PickRandom<AppointmentType>())
            .RuleFor(a => a.Status, (f, a) =>
            {
                var appointmentDateTime = a.Date.ToDateTime(TimeOnly.MinValue);
                if (appointmentDateTime < DateTime.UtcNow.AddDays(-1))
                    return f.PickRandom(AppointmentStatus.Done, AppointmentStatus.Cancelled);
                if (appointmentDateTime < DateTime.UtcNow)
                    return AppointmentStatus.Done;
                return f.PickRandom(AppointmentStatus.Pending, AppointmentStatus.Approved);
            })
            .RuleFor(a => a.Reason, f => f.Lorem.Sentence())
            .RuleFor(a => a.MeetingLink, (f, a) => a.Type == AppointmentType.Online ? f.Internet.Url() : null)
            .RuleFor(a => a.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(1), DateTimeKind.Utc));

        return appointmentFaker.Generate(count);
    }

    private static List<MedicalRecord> GenerateMedicalRecords(List<User> patients, List<Doctor> doctors, List<Appointment> completedAppointments)
    {
        var medicalRecords = new List<MedicalRecord>();
        var random = new Random();

        // Create records for ~60% of completed appointments
        var appointmentsWithRecords = completedAppointments.OrderBy(x => random.Next()).Take((int)(completedAppointments.Count * 0.6)).ToList();

        foreach (var appointment in appointmentsWithRecords)
        {
            var record = new Faker<MedicalRecord>()
                .RuleFor(m => m.Id, f => Guid.NewGuid())
                .RuleFor(m => m.PatientId, f => appointment.PatientId)
                .RuleFor(m => m.DoctorId, f => appointment.DoctorId)
                .RuleFor(m => m.AppointmentId, f => appointment.Id)
                .RuleFor(m => m.Diagnosis, f => f.Lorem.Sentence(5))
                .RuleFor(m => m.Symptoms, f => f.Lorem.Paragraph())
                .RuleFor(m => m.Treatment, f => f.Lorem.Paragraph())
                .RuleFor(m => m.Prescription, f => f.Random.Bool(0.7f) ? f.Lorem.Paragraph() : null)
                .RuleFor(m => m.Notes, f => f.Lorem.Paragraph())
                .RuleFor(m => m.BloodPressureSystolic, f => f.Random.Bool(0.8f) ? f.Random.Decimal(100, 140) : null)
                .RuleFor(m => m.BloodPressureDiastolic, f => f.Random.Bool(0.8f) ? f.Random.Decimal(60, 90) : null)
                .RuleFor(m => m.HeartRate, f => f.Random.Bool(0.8f) ? f.Random.Decimal(60, 100) : null)
                .RuleFor(m => m.Temperature, f => f.Random.Bool(0.7f) ? f.Random.Decimal(36.0m, 37.5m) : null)
                .RuleFor(m => m.Weight, f => f.Random.Bool(0.6f) ? f.Random.Decimal(50, 120) : null)
                .RuleFor(m => m.Height, f => f.Random.Bool(0.6f) ? f.Random.Decimal(150, 200) : null)
                .RuleFor(m => m.FollowUpDate, f => f.Random.Bool(0.3f) ? DateTime.SpecifyKind(f.Date.Future(2), DateTimeKind.Utc) : null)
                .RuleFor(m => m.FollowUpNotes, f => f.Random.Bool(0.3f) ? f.Lorem.Sentence() : null)
                .RuleFor(m => m.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(1), DateTimeKind.Utc))
                .Generate();

            medicalRecords.Add(record);
        }

        return medicalRecords;
    }

    private static List<FileUpload> GenerateFileUploads(List<User> uploaders, int count)
    {
        var fileExtensions = new[] { "pdf", "jpg", "png", "docx" };
        var fileFaker = new Faker<FileUpload>()
            .RuleFor(f => f.Id, f => Guid.NewGuid())
            .RuleFor(f => f.OriginalFileName, f => $"{f.System.FileName()}.{f.PickRandom(fileExtensions)}")
            .RuleFor(f => f.FileName, f => $"{Guid.NewGuid()}.{f.PickRandom(fileExtensions)}")
            .RuleFor(f => f.ContentType, (f, file) => file.OriginalFileName.EndsWith("pdf") ? "application/pdf" : "image/jpeg")
            .RuleFor(f => f.Size, f => f.Random.Long(100000, 5000000))
            .RuleFor(f => f.Path, f => "/uploads/files")
            .RuleFor(f => f.UploadedBy, f => f.PickRandom(uploaders).Id)
            .RuleFor(f => f.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(1), DateTimeKind.Utc));

        return fileFaker.Generate(count);
    }

    private static List<MedicalRecordAttachment> GenerateMedicalRecordAttachments(List<MedicalRecord> medicalRecords, List<FileUpload> fileUploads)
    {
        var attachments = new List<MedicalRecordAttachment>();
        var random = new Random();
        var attachmentTypes = new[] { "Scan", "LabResult", "Prescription", "Xray", "Other" };

        // Add 1-3 attachments to ~40% of medical records
        var recordsWithAttachments = medicalRecords.OrderBy(x => random.Next()).Take((int)(medicalRecords.Count * 0.4)).ToList();

        foreach (var record in recordsWithAttachments)
        {
            var numAttachments = random.Next(1, 4);
            var selectedFiles = fileUploads.OrderBy(x => random.Next()).Take(numAttachments).ToList();

            foreach (var file in selectedFiles)
            {
                attachments.Add(new MedicalRecordAttachment
                {
                    Id = Guid.NewGuid(),
                    MedicalRecordId = record.Id,
                    FileUploadId = file.Id,
                    Description = new Faker().Lorem.Sentence(3),
                    AttachmentType = attachmentTypes[random.Next(attachmentTypes.Length)],
                    CreatedAt = DateTime.SpecifyKind(record.CreatedAt.AddMinutes(random.Next(5, 60)), DateTimeKind.Utc)
                });
            }
        }

        return attachments;
    }

    private static List<DoctorRating> GenerateDoctorRatings(List<User> patients, List<Doctor> doctors, int count)
    {
        var ratings = new List<DoctorRating>();
        var usedCombinations = new HashSet<(Guid DoctorId, Guid PatientId)>();
        var random = new Random();
        var faker = new Faker();

        while (ratings.Count < count && usedCombinations.Count < doctors.Count * patients.Count)
        {
            var doctor = doctors[random.Next(doctors.Count)];
            var patient = patients[random.Next(patients.Count)];
            var combination = (doctor.Id, patient.Id);

            if (usedCombinations.Add(combination))
            {
                ratings.Add(new DoctorRating
                {
                    Id = Guid.NewGuid(),
                    DoctorId = doctor.Id,
                    PatientId = patient.Id,
                    Rating = faker.Random.Int(3, 5),
                    Comment = faker.Random.Bool(0.7f) ? faker.Lorem.Paragraph() : null,
                    CreatedAt = DateTime.SpecifyKind(faker.Date.Past(1), DateTimeKind.Utc)
                });
            }
        }

        return ratings;
    }

    private static async Task UpdateDoctorRatings(ApplicationDbContext context, List<Doctor> doctors)
    {
        foreach (var doctor in doctors)
        {
            var ratings = await context.DoctorRatings
                .Where(r => r.DoctorId == doctor.Id)
                .ToListAsync();

            if (ratings.Any())
            {
                doctor.Rating = ratings.Average(r => r.Rating);
                doctor.RatingCount = ratings.Count;
            }
        }

        await context.SaveChangesAsync();
    }

    private static List<Notification> GenerateNotifications(List<User> patients, List<User> doctors, List<User> secretaries, int count)
    {
        var allUsers = patients.Concat(doctors).Concat(secretaries).ToList();
        var notificationTypes = new[] 
        { 
            "AppointmentConfirmed", 
            "AppointmentCancelled", 
            "AppointmentReminder", 
            "NewMessage", 
            "MedicalRecordAdded" 
        };

        var notificationFaker = new Faker<Notification>()
            .RuleFor(n => n.Id, f => Guid.NewGuid())
            .RuleFor(n => n.UserId, f => f.PickRandom(allUsers).Id)
            .RuleFor(n => n.Title, f => f.Lorem.Sentence(3))
            .RuleFor(n => n.Message, f => f.Lorem.Paragraph())
            .RuleFor(n => n.Type, f => f.PickRandom(notificationTypes))
            .RuleFor(n => n.IsRead, f => f.Random.Bool(0.6f))
            .RuleFor(n => n.CreatedAt, f => DateTime.SpecifyKind(f.Date.Past(1), DateTimeKind.Utc));

        return notificationFaker.Generate(count);
    }
}
