using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using HealthFlow_backend.Data;
using HealthFlow_backend.Hubs;
using HealthFlow_backend.Middleware;
using HealthFlow_backend.Providers;
using HealthFlow_backend.Repositories.Implementations;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Implementations;
using HealthFlow_backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names (matches JavaScript conventions)
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        // Convert enums to strings
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // Ignore null values
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "HealthFlow API", 
        Version = "v1",
        Description = "Healthcare Management System API"
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure MySQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configure JWT Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HealthFlow";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "HealthFlowClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Configure SignalR JWT authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Configure SignalR
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

// Register Repositories
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<ISpecializationService, SpecializationService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IClinicService, ClinicService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFileService, FileService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HealthFlow API v1");
    });
}

// Add exception middleware
app.UseMiddleware<ExceptionMiddleware>();

// Enable CORS
app.UseCors("AllowFrontend");

// Enable authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Map SignalR hubs
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<AppointmentHub>("/hubs/appointments");

// Database migration and seeding (development only)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        dbContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "An error occurred while migrating the database. Running without migrations.");
    }
}

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Database test endpoint (development only)
if (app.Environment.IsDevelopment())
{
    app.MapGet("/db-test", async (ApplicationDbContext db) =>
    {
        try
        {
            var canConnect = await db.Database.CanConnectAsync();
            return Results.Ok(new { 
                connected = canConnect,
                message = canConnect ? "Database connection successful!" : "Cannot connect to database",
                database = "MySQL"
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Database error: {ex.Message}");
        }
    });
}

app.Run();