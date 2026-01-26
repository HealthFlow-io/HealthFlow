using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure MySQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Only use HTTPS redirection in production
    app.UseHttpsRedirection();
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast")
    .WithOpenApi();

// Test endpoint for database connection
app.MapGet("/db-test", async (ApplicationDbContext db) =>
    {
        try
        {
            var canConnect = await db.Database.CanConnectAsync();
            return Results.Ok(new { 
                connected = canConnect,
                message = canConnect ? "Database connection successful!" : "Cannot connect to database",
                database = "MySQL on port 3306"
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Database error: {ex.Message}");
        }
    })
    .WithName("TestDatabaseConnection")
    .WithOpenApi();

// Get all patients
app.MapGet("/api/patients", async (ApplicationDbContext db) =>
    {
        var patients = await db.Patients.ToListAsync();
        return Results.Ok(patients);
    })
    .WithName("GetPatients")
    .WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    // Correction: use the accurate Celsius -> Fahrenheit conversion and round the result
    public int TemperatureF => 32 + (int)Math.Round(TemperatureC * 9.0 / 5.0);
    
}