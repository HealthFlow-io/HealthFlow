using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.DTOs.Appointments;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Appointment?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Specialization)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.User)
            .Include(a => a.Clinic)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByPatientAsync(
        Guid patientId, AppointmentFilterParams filterParams)
    {
        var query = BuildFilteredQuery(filterParams)
            .Where(a => a.PatientId == patientId);

        var totalCount = await query.CountAsync();
        var appointments = await ApplyPagination(query, filterParams).ToListAsync();

        return (appointments, totalCount);
    }

    public async Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByDoctorAsync(
        Guid doctorId, AppointmentFilterParams filterParams)
    {
        var query = BuildFilteredQuery(filterParams)
            .Where(a => a.DoctorId == doctorId);

        var totalCount = await query.CountAsync();
        var appointments = await ApplyPagination(query, filterParams).ToListAsync();

        return (appointments, totalCount);
    }

    public async Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByClinicAsync(
        Guid clinicId, AppointmentFilterParams filterParams)
    {
        var query = BuildFilteredQuery(filterParams)
            .Where(a => a.ClinicId == clinicId);

        var totalCount = await query.CountAsync();
        var appointments = await ApplyPagination(query, filterParams).ToListAsync();

        return (appointments, totalCount);
    }

    public async Task<IEnumerable<Appointment>> GetDoctorAppointmentsForDateAsync(Guid doctorId, DateOnly date)
    {
        return await _dbSet
            .Where(a => a.DoctorId == doctorId && 
                       a.Date == date && 
                       a.Status != AppointmentStatus.Cancelled &&
                       a.Status != AppointmentStatus.Declined)
            .OrderBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<bool> HasConflictAsync(Guid doctorId, DateOnly date, TimeSpan startTime, TimeSpan endTime, Guid? excludeAppointmentId = null)
    {
        var query = _dbSet.Where(a => 
            a.DoctorId == doctorId && 
            a.Date == date &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.Declined &&
            ((a.StartTime <= startTime && a.EndTime > startTime) ||
             (a.StartTime < endTime && a.EndTime >= endTime) ||
             (a.StartTime >= startTime && a.EndTime <= endTime)));

        if (excludeAppointmentId.HasValue)
        {
            query = query.Where(a => a.Id != excludeAppointmentId.Value);
        }

        return await query.AnyAsync();
    }

    private IQueryable<Appointment> BuildFilteredQuery(AppointmentFilterParams filterParams)
    {
        var query = _dbSet
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Specialization)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.User)
            .Include(a => a.Clinic)
            .AsQueryable();

        if (filterParams.Status.HasValue)
        {
            query = query.Where(a => a.Status == filterParams.Status.Value);
        }

        if (filterParams.Type.HasValue)
        {
            query = query.Where(a => a.Type == filterParams.Type.Value);
        }

        if (!string.IsNullOrEmpty(filterParams.StartDate) && DateOnly.TryParse(filterParams.StartDate, out var startDate))
        {
            query = query.Where(a => a.Date >= startDate);
        }

        if (!string.IsNullOrEmpty(filterParams.EndDate) && DateOnly.TryParse(filterParams.EndDate, out var endDate))
        {
            query = query.Where(a => a.Date <= endDate);
        }

        return query.OrderByDescending(a => a.Date).ThenBy(a => a.StartTime);
    }

    private IQueryable<Appointment> ApplyPagination(IQueryable<Appointment> query, AppointmentFilterParams filterParams)
    {
        return query
            .Skip((filterParams.Page - 1) * filterParams.PageSize)
            .Take(filterParams.PageSize);
    }
}
