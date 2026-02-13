using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Doctor> Doctors { get; set; }
    public DbSet<Specialization> Specializations { get; set; }
    public DbSet<DoctorAvailability> DoctorAvailabilities { get; set; }
    public DbSet<DoctorRating> DoctorRatings { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Clinic> Clinics { get; set; }
    public DbSet<ClinicWorkingHours> ClinicWorkingHours { get; set; }
    public DbSet<MedicalRecord> MedicalRecords { get; set; }
    public DbSet<MedicalRecordAttachment> MedicalRecordAttachments { get; set; }
    public DbSet<SecretaryProfile> SecretaryProfiles { get; set; }
    public DbSet<SecretaryDoctor> SecretaryDoctors { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<FileUpload> FileUploads { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        // Doctor configuration
        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Bio).HasMaxLength(2000);
            entity.Property(e => e.ConsultationPrice).HasPrecision(18, 2);
            entity.Property(e => e.SubSpecializations).HasMaxLength(1000);
            entity.Property(e => e.Languages).HasMaxLength(500);
            entity.Property(e => e.ConsultationTypes).HasMaxLength(200);

            entity.HasOne(e => e.User)
                .WithOne(u => u.DoctorProfile)
                .HasForeignKey<Doctor>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Specialization)
                .WithMany(s => s.Doctors)
                .HasForeignKey(e => e.SpecializationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Clinic)
                .WithMany(c => c.Doctors)
                .HasForeignKey(e => e.ClinicId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Specialization configuration
        modelBuilder.Entity<Specialization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // DoctorAvailability configuration
        modelBuilder.Entity<DoctorAvailability>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DayOfWeek).HasConversion<int>();

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.Availabilities)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DoctorRating configuration
        modelBuilder.Entity<DoctorRating>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Rating).IsRequired();
            entity.Property(e => e.Comment).HasMaxLength(1000);

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.Ratings)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent duplicate ratings from same patient
            entity.HasIndex(e => new { e.DoctorId, e.PatientId }).IsUnique();
        });

        // Appointment configuration
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Reason).HasMaxLength(1000);
            entity.Property(e => e.MeetingLink).HasMaxLength(500);

            entity.HasOne(e => e.Patient)
                .WithMany(u => u.PatientAppointments)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Clinic)
                .WithMany(c => c.Appointments)
                .HasForeignKey(e => e.ClinicId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Clinic configuration
        modelBuilder.Entity<Clinic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Website).HasMaxLength(200);
        });

        // ClinicWorkingHours configuration
        modelBuilder.Entity<ClinicWorkingHours>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DayOfWeek).HasConversion<int>();

            entity.HasOne(e => e.Clinic)
                .WithMany(c => c.WorkingHours)
                .HasForeignKey(e => e.ClinicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MedicalRecord configuration
        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Notes).IsRequired();
            entity.Property(e => e.PrescriptionUrl).HasMaxLength(500);
            entity.Property(e => e.Diagnosis).HasMaxLength(1000);
            entity.Property(e => e.Symptoms).HasMaxLength(1000);
            entity.Property(e => e.Treatment).HasMaxLength(2000);
            entity.Property(e => e.Prescription).HasMaxLength(2000);
            entity.Property(e => e.FollowUpNotes).HasMaxLength(500);

            entity.HasOne(e => e.Patient)
                .WithMany(u => u.PatientMedicalRecords)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.MedicalRecords)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Appointment)
                .WithMany()
                .HasForeignKey(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // MedicalRecordAttachment configuration
        modelBuilder.Entity<MedicalRecordAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AttachmentType).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasOne(e => e.MedicalRecord)
                .WithMany(m => m.Attachments)
                .HasForeignKey(e => e.MedicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.FileUpload)
                .WithMany()
                .HasForeignKey(e => e.FileUploadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SecretaryProfile configuration
        modelBuilder.Entity<SecretaryProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.SecretaryProfile)
                .HasForeignKey<SecretaryProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SecretaryDoctor (many-to-many) configuration
        modelBuilder.Entity<SecretaryDoctor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SecretaryProfileId, e.DoctorId }).IsUnique();

            entity.HasOne(e => e.SecretaryProfile)
                .WithMany(s => s.SecretaryDoctors)
                .HasForeignKey(e => e.SecretaryProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.SecretaryDoctors)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Data).HasMaxLength(2000);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);

            entity.HasOne(e => e.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(e => e.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.SenderId, e.ReceiverId });
            entity.HasIndex(e => e.CreatedAt);
        });

        // FileUpload configuration
        modelBuilder.Entity<FileUpload>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Path).IsRequired().HasMaxLength(500);

            entity.HasOne(e => e.Uploader)
                .WithMany()
                .HasForeignKey(e => e.UploadedBy)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed initial data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed Specializations
        modelBuilder.Entity<Specialization>().HasData(
            new Specialization { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Cardiology", Category = "Medical", Description = "Heart and cardiovascular system" },
            new Specialization { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Dermatology", Category = "Medical", Description = "Skin, hair, and nails" },
            new Specialization { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Neurology", Category = "Medical", Description = "Brain and nervous system" },
            new Specialization { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Orthopedics", Category = "Surgical", Description = "Bones and joints" },
            new Specialization { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Pediatrics", Category = "Medical", Description = "Children's health" },
            new Specialization { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Name = "Psychiatry", Category = "Mental Health", Description = "Mental health disorders" },
            new Specialization { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), Name = "General Surgery", Category = "Surgical", Description = "General surgical procedures" },
            new Specialization { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), Name = "Dentistry", Category = "Medical", Description = "Teeth and oral health" },
            new Specialization { Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), Name = "Ophthalmology", Category = "Medical", Description = "Eye care and vision" },
            new Specialization { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name = "Gynecology", Category = "Medical", Description = "Women's health" }
        );
    }
}
