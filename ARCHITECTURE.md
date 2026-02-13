# HealthFlow — Architecture Documentation

This document provides a deep, file-by-file explanation of every folder and file in the HealthFlow project, covering the **backend** (.NET 8), **frontend** (Next.js 16), **API consumption layer**, **SignalR real-time system**, and **authentication flow**.

---

## Table of Contents

1. [Backend Architecture](#1-backend-architecture)
   - [Entry Point & DI Configuration](#11-entry-point--di-configuration)
   - [Controllers](#12-controllers)
   - [Models](#13-models)
   - [DTOs (Data Transfer Objects)](#14-dtos-data-transfer-objects)
   - [Services](#15-services)
   - [Repositories & Unit of Work](#16-repositories--unit-of-work)
   - [SignalR Hubs](#17-signalr-hubs)
   - [Data Layer](#18-data-layer)
   - [Configuration](#19-configuration)
   - [Middleware](#110-middleware)
   - [Providers](#111-providers)
   - [Migrations](#112-migrations)
2. [Frontend Architecture](#2-frontend-architecture)
   - [App Router & Pages](#21-app-router--pages)
   - [Components](#22-components)
   - [Hooks](#23-hooks)
   - [Services (API Layer)](#24-services-api-layer)
   - [Lib (Core Utilities)](#25-lib-core-utilities)
   - [Providers](#26-providers)
   - [Store (State Management)](#27-store-state-management)
   - [Types](#28-types)
3. [API Consumption Flow](#3-api-consumption-flow)
4. [SignalR Real-Time System](#4-signalr-real-time-system)
5. [Authentication & Authorization](#5-authentication--authorization)

---

## 1. Backend Architecture

**Location:** `Back/HealthFlow_backend/HealthFlow_backend/`  
**Framework:** ASP.NET Core 8 (.NET 8)  
**Pattern:** Repository + Unit of Work + Service Layer  
**Database:** PostgreSQL (Neon Cloud) via EF Core 8 + Npgsql

### Folder Overview

```
HealthFlow_backend/
├── Program.cs                 # Entry point: DI, middleware pipeline, hub mapping
├── appsettings.json           # App config (DB, JWT, CORS, file storage)
├── appsettings.Development.json
├── Dockerfile                 # Container build instructions
├── Configuration/             # Strongly-typed config classes
├── Controllers/               # REST API endpoints (11 controllers)
├── Data/                      # EF Core DbContext + database seeder
├── DTOs/                      # Input/output data shapes per module
├── Hubs/                      # SignalR real-time hubs (3 hubs)
├── Middleware/                 # HTTP pipeline middleware
├── Migrations/                # EF Core database migrations
├── Models/                    # Domain entities + enums
├── Providers/                 # SignalR custom providers
├── Repositories/              # Data access layer (Repository + UoW)
├── Services/                  # Business logic layer
└── Uploads/                   # File storage directory
```

---

### 1.1 Entry Point & DI Configuration

#### `Program.cs`

The single entry point that configures the entire application. It performs the following in order:

| Step | What it does |
|---|---|
| **JSON options** | Configures camelCase serialization, string enums, null exclusion |
| **Swagger** | Registers SwaggerGen with JWT Bearer security definition so the UI lets you paste tokens |
| **PostgreSQL** | Reads `ConnectionStrings:DefaultConnection` and registers `ApplicationDbContext` with Npgsql |
| **JWT Auth** | Reads `Jwt:SecretKey/Issuer/Audience`, sets up `JwtBearerDefaults` with `TokenValidationParameters`; hooks `OnMessageReceived` to extract `access_token` from query string for `/hubs` routes |
| **CORS** | Reads `Cors:AllowedOrigins` array, creates `AllowFrontend` policy with credentials support |
| **SignalR** | `AddSignalR()` + registers `UserIdProvider` as singleton |
| **Repositories** | Registers `IUnitOfWork → UnitOfWork` as scoped |
| **Services** | Registers 9 scoped services: `IJwtService`, `IAuthService`, `IDoctorService`, `ISpecializationService`, `IAppointmentService`, `IClinicService`, `IMedicalRecordService`, `INotificationService`, `IFileService`, `IChatService` |
| **Pipeline** | `ExceptionMiddleware` → CORS → Authentication → Authorization → Controllers → SignalR hubs |
| **Hub mapping** | `/hubs/notifications` → `NotificationHub`, `/hubs/appointments` → `AppointmentHub`, `/hubs/chat` → `ChatHub` |
| **Auto-migrate** | In development, calls `dbContext.Database.Migrate()` on startup |
| **Seed command** | If run with `dotnet run -- seed`, invokes `DatabaseSeeder.SeedAsync()` then exits |
| **Health check** | `GET /health` returns `{ status, timestamp }` |

---

### 1.2 Controllers

Each controller is an `[ApiController]` with `[Route("api/[controller]")]`. They depend on services via constructor injection and use `[Authorize]` / `[Authorize(Roles = "...")]` for access control.

| File | Route | Purpose |
|---|---|---|
| `AuthController.cs` | `/api/auth` | Register, Login, Logout, RefreshToken, ForgotPassword, ResetPassword, `GET /me` (current user) |
| `AppointmentsController.cs` | `/api/appointments` | CRUD for appointments; status transitions (`/approve`, `/decline`, `/cancel`, `/complete`); query by patient/doctor/clinic; available slots endpoint |
| `ChatController.cs` | `/api/chat` | `GET /contacts` (fast contact list with unread counts), `GET /conversations/{userId}` (message history), `POST /send` (save + push via SignalR), `PUT /conversations/{id}/read`, `GET /unread-count` |
| `DoctorsController.cs` | `/api/doctors` | Doctor profile CRUD, search, `/me`, availability (`GET/PUT /{id}/availability`), schedule, ratings |
| `ClinicsController.cs` | `/api/clinics` | Clinic CRUD, search, nearby |
| `SpecializationsController.cs` | `/api/specializations` | Specialization CRUD, by category |
| `MedicalRecordsController.cs` | `/api/medical-records` | Create/view medical records, by patient/doctor, attachments |
| `NotificationsController.cs` | `/api/notifications` | List, mark read, mark all read, unread count |
| `FilesController.cs` | `/api/files` | Upload (multipart/form-data), download, delete |
| `AdminController.cs` | `/api/admin` | Admin-only: CRUD for users/doctors/secretaries, dashboard statistics |
| `SecretariesController.cs` | `/api/secretaries` | Secretary profiles, assigned doctors, patients, manage appointments for doctors |

**Common patterns in controllers:**
- Extract user ID from `User.FindFirst(ClaimTypes.NameIdentifier)?.Value`
- Return `IActionResult` with `Ok()`, `NotFound()`, `BadRequest()`
- Delegate all business logic to service layer (controllers are thin)

---

### 1.3 Models

#### `Models/Entities/` — 14 Domain Entity Classes

| File | Entity | Key Properties |
|---|---|---|
| `User.cs` | `User` | Id (Guid), FirstName, LastName, Email, PasswordHash, Role (enum), Phone, RefreshToken, CreatedAt |
| `Doctor.cs` | `Doctor` | Id, UserId → User, SpecializationId → Specialization, ClinicId → Clinic, Bio, LicenseNumber, YearsOfExperience, ConsultationDuration, ConsultationPrice, Languages, ConsultationTypes |
| `DoctorAvailability.cs` | `DoctorAvailability` | Id, DoctorId → Doctor, DayOfWeek, StartTime, EndTime |
| `DoctorRating.cs` | `DoctorRating` | Id, DoctorId → Doctor, PatientId → User, Rating (1-5), Comment, CreatedAt |
| `Appointment.cs` | `Appointment` | Id, PatientId → User, DoctorId → Doctor, ClinicId → Clinic, Date, StartTime, EndTime, Type (enum), Status (enum), MeetingLink, Reason, ApprovedBy |
| `Clinic.cs` | `Clinic` | Id, Name, Address, City, Phone, Email, Description, GeoLocation, OpeningTime, ClosingTime |
| `ClinicWorkingHours.cs` | `ClinicWorkingHours` | Id, ClinicId → Clinic, DayOfWeek, OpenTime, CloseTime, IsClosed |
| `Specialization.cs` | `Specialization` | Id, Name, Category, Description |
| `SecretaryProfile.cs` | `SecretaryProfile` | Id, UserId → User |
| `SecretaryDoctor.cs` | `SecretaryDoctor` | Id, SecretaryProfileId → SecretaryProfile, DoctorId → Doctor (many-to-many join) |
| `MedicalRecord.cs` | `MedicalRecord` | Id, PatientId → User, DoctorId → Doctor, AppointmentId, Diagnosis, Symptoms, Treatment, Prescription, Notes, VitalSigns (JSON), Attachments collection |
| `FileUpload.cs` | `FileUpload` | Id, FileName, FilePath, ContentType, Size, UploadedBy → User, CreatedAt |
| `ChatMessage.cs` | `ChatMessage` | Id, SenderId → User, ReceiverId → User, Content, IsRead, CreatedAt |
| `Notification.cs` | `Notification` | Id, UserId → User, Title, Message, Type, IsRead, Data (JSON), CreatedAt |

#### `Models/Enums/` — 4 Enum Files

| File | Enum | Values |
|---|---|---|
| `UserRole.cs` | `UserRole` | `Admin`, `Doctor`, `Secretary`, `Patient`, `ClinicManager` |
| `AppointmentStatus.cs` | `AppointmentStatus` | `Pending`, `Approved`, `Declined`, `Cancelled`, `Done` |
| `AppointmentType.cs` | `AppointmentType` | `Online`, `Physical` |
| `ConsultationType.cs` | `ConsultationType` | `Online`, `Physical`, `HomeVisit` |

---

### 1.4 DTOs (Data Transfer Objects)

DTOs define the shape of request/response payloads. Organized by domain module:

| Folder | Contents |
|---|---|
| `DTOs/Auth/` | `LoginDto`, `RegisterDto`, `LoginResponseDto`, `RefreshTokenDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `UserDto` |
| `DTOs/Appointments/` | `AppointmentCreateDto`, `AppointmentUpdateDto`, `AppointmentResponseDto`, `AppointmentRescheduleDto`, `AppointmentFilterDto`, `AvailableSlotDto` |
| `DTOs/Chat/` | `SendMessageDto`, `ChatMessageDto`, `ChatContactDto`, `UnreadCountDto` |
| `DTOs/Doctors/` | `DoctorCreateDto`, `DoctorUpdateDto`, `DoctorResponseDto`, `DoctorSearchDto`, `DoctorAvailabilityDto`, `DoctorRatingDto` |
| `DTOs/Clinics/` | `ClinicCreateDto`, `ClinicUpdateDto`, `ClinicResponseDto`, `ClinicSearchDto` |
| `DTOs/Specializations/` | `SpecializationCreateDto`, `SpecializationUpdateDto`, `SpecializationResponseDto` |
| `DTOs/Notifications/` | `NotificationDto`, `NotificationCreateDto`, `UnreadCountDto` |
| `DTOs/MedicalRecords/` | `MedicalRecordCreateDto`, `MedicalRecordUpdateDto`, `MedicalRecordResponseDto`, `AddAttachmentDto` |
| `DTOs/Secretaries/` | `SecretaryProfileDto`, `SecretaryDoctorDto` |
| `DTOs/Admin/` | `AdminUserDto`, `AdminDoctorDto`, `DashboardStatsDto` |
| `DTOs/Common/` | `PaginatedResponseDto<T>` (page, pageSize, totalCount, totalPages, data) |

**Convention:** Controllers accept `*CreateDto`/`*UpdateDto` as input and return `*ResponseDto` or `*Dto` as output. Manual mapping happens in service implementations (no AutoMapper).

---

### 1.5 Services

The service layer contains all business logic. Each interface lives in `Services/Interfaces/` and its implementation in `Services/Implementations/`.

| Interface | Implementation | Responsibilities |
|---|---|---|
| `IAuthService` | `AuthService` | Register (hash password, create User), Login (verify password, generate JWT + refresh token), RefreshToken, ForgotPassword (generate reset token), ResetPassword, GetCurrentUser |
| `IJwtService` | `JwtService` | GenerateToken (claims → JWT string), GenerateRefreshToken, ValidateRefreshToken, GetPrincipalFromExpiredToken |
| `IDoctorService` | `DoctorService` | Doctor CRUD, search with filters (specialization, location, price, rating), manage availability schedule, get available time slots for a date |
| `IAppointmentService` | `AppointmentService` | Create appointment (validate slot availability), approve/decline/cancel/complete status transitions, query by patient/doctor/clinic with pagination and filters |
| `IChatService` | `ChatService` | GetContacts (with last message + unread count), GetConversation (paginated messages between two users), SendMessage (save to DB), MarkAsRead, GetUnreadCount |
| `IClinicService` | `ClinicService` | Clinic CRUD, search, nearby (distance calculation) |
| `INotificationService` | `NotificationService` | Create notification, list by user (paginated), mark read, mark all read, unread count |
| `IMedicalRecordService` | `MedicalRecordService` | Create record, list by patient/doctor, add attachment |
| `ISpecializationService` | `SpecializationService` | Specialization CRUD, by category |
| `IFileService` | `FileService` | Upload file to disk (Uploads/ directory), generate download URL, delete |

**Dependency:** Services depend on `IUnitOfWork` and use its repository properties. They never access `ApplicationDbContext` directly (except through UoW).

**SignalR in services:** `ChatService` and `NotificationService` also depend on `IHubContext<ChatHub>` and `IHubContext<NotificationHub>` to push real-time messages after data is persisted.

---

### 1.6 Repositories & Unit of Work

#### Generic Repository — `IRepository<T>` / `Repository<T>`

The base repository provides standard EF Core operations for any entity:

```
GetByIdAsync(Guid id)          → Find by primary key
GetAllAsync()                  → All entities
FindAsync(predicate)           → Filter with LINQ expression
FirstOrDefaultAsync(predicate) → Single-or-null
AddAsync(entity)               → Track new entity
AddRangeAsync(entities)        → Batch insert
Update(entity)                 → Mark as modified
Remove(entity)                 → Mark for deletion
RemoveRange(entities)          → Batch delete
ExistsAsync(predicate)         → Any match
CountAsync(predicate?)         → Count (optionally filtered)
Query()                        → Raw IQueryable<T> for complex queries
```

#### Specific Repositories

Each entity has a dedicated repository interface extending `IRepository<T>` with entity-specific queries:

| Interface | Implementation | Extra Methods |
|---|---|---|
| `IUserRepository` | `UserRepository` | FindByEmail, FindByRefreshToken |
| `IDoctorRepository` | `DoctorRepository` | Search with includes (User, Specialization, Clinic), GetWithAvailability |
| `IAppointmentRepository` | `AppointmentRepository` | GetByPatient, GetByDoctor, GetByDateRange, GetConflicting |
| `IChatMessageRepository` | `ChatMessageRepository` | GetConversation (between 2 users), GetUnreadCount, MarkAsRead |
| `IClinicRepository` | `ClinicRepository` | SearchByName, GetWithWorkingHours |
| `INotificationRepository` | `NotificationRepository` | GetByUser, GetUnreadCount, MarkAllRead |
| `IMedicalRecordRepository` | `MedicalRecordRepository` | GetByPatient, GetByDoctor, GetWithAttachments |
| `IMedicalRecordAttachmentRepository` | `MedicalRecordAttachmentRepository` | GetByRecordId |
| `ISecretaryRepository` | `SecretaryRepository` | GetByUserId, GetWithDoctors |
| `ISpecializationRepository` | `SpecializationRepository` | GetByCategory |
| `IFileRepository` | `FileRepository` | GetByUploader |

#### Unit of Work — `IUnitOfWork` / `UnitOfWork`

The UoW pattern coordinates transactions across multiple repositories:

```csharp
public interface IUnitOfWork : IDisposable
{
    ApplicationDbContext Context { get; }
    IUserRepository Users { get; }
    IDoctorRepository Doctors { get; }
    ISpecializationRepository Specializations { get; }
    IAppointmentRepository Appointments { get; }
    IClinicRepository Clinics { get; }
    IMedicalRecordRepository MedicalRecords { get; }
    IMedicalRecordAttachmentRepository MedicalRecordAttachments { get; }
    ISecretaryRepository Secretaries { get; }
    INotificationRepository Notifications { get; }
    IFileRepository Files { get; }
    IChatMessageRepository ChatMessages { get; }
    Task<int> SaveChangesAsync();
}
```

**Lazy initialization:** Repository properties use the `??=` operator — each repo is only created when first accessed:
```csharp
public IUserRepository Users => _users ??= new UserRepository(_context);
```

This avoids creating all 11 repositories for every request; only the needed ones are instantiated.

---

### 1.7 SignalR Hubs

All hubs live in `Hubs/` and require authentication (`[Authorize]`). SignalR maps user connections via `UserIdProvider`.

| File | Hub | Endpoint | Events |
|---|---|---|---|
| `NotificationHub.cs` | `NotificationHub` | `/hubs/notifications` | **Server→Client:** `ReceiveNotification(Notification)`, `NotificationRead(id)` |
| `AppointmentHub.cs` | `AppointmentHub` | `/hubs/appointments` | **Server→Client:** `AppointmentStatusChanged(Appointment)`, `NewAppointmentRequest(Appointment)`, `AppointmentCancelled(id)`, `AppointmentReminder(Appointment)`. **Client→Server:** `JoinDoctorRoom(doctorId)`, `JoinGroup(groupName)` |
| `ChatHub.cs` | `ChatHub` | `/hubs/chat` | **Server→Client:** `ReceiveMessage(ChatMessage)`, `UserTyping({userId})`, `MessagesRead({readBy})`, `MessageError({error})`. **Client→Server:** `JoinConversation(otherUserId)`, `LeaveConversation(otherUserId)`, `SendTyping(receiverId)`, `MarkAsRead(senderId)` |

#### Chat Hub Room Architecture

The chat system uses a **REST-first** approach for reliability:

1. **Send:** Client calls `POST /api/chat/send` (REST) → Service saves message to DB → Service uses `IHubContext<ChatHub>` to push `ReceiveMessage` to the receiver
2. **Rooms:** When a user opens a conversation, the client calls `JoinConversation(otherUserId)` which creates a room key like `chat_{minId}_{maxId}` for the pair
3. **Typing:** Sent via SignalR `SendTyping` → broadcast to the room
4. **Read receipts:** Sent via SignalR `MarkAsRead` → broadcast to the room

This design ensures messages are **never lost** (persisted via REST before pushing) while maintaining real-time UX.

---

### 1.8 Data Layer

#### `Data/ApplicationDbContext.cs`

Extends `DbContext` with `DbSet<T>` properties for all 14 entities. Configures:
- Entity relationships (one-to-many, many-to-many via SecretaryDoctor)
- Indexes (unique email on User, composite indexes for performance)
- Value conversions (enums to strings, JSON columns)
- Cascade delete behaviors

#### `Data/DatabaseSeeder.cs`

Static class with `SeedAsync(ApplicationDbContext)` method. Uses the **Bogus** library to generate realistic fake data:
- Admin user (fixed credentials for testing)
- Specializations (Cardiology, Neurology, Pediatrics, etc.)
- Clinics with working hours and geolocation
- Doctors with availability schedules, bios, ratings
- Patients with varied profiles
- Secretaries assigned to doctors
- Appointments in various statuses
- Medical records with sample diagnoses
- Notifications

Invoked via: `dotnet run -- seed`

---

### 1.9 Configuration

| File | Class | Purpose |
|---|---|---|
| `Configuration/JwtSettings.cs` | `JwtSettings` | Strongly-typed JWT config: `SecretKey`, `Issuer` ("HealthFlow"), `Audience` ("HealthFlowClient"), `ExpirationMinutes` (60), `RefreshTokenExpirationDays` (7) |
| `Configuration/CorsSettings.cs` | `CorsSettings` | `AllowedOrigins` string array (localhost:3000, localhost:3001, Vercel URL) |
| `appsettings.json` | — | Connection string (Neon PostgreSQL), JWT section, CORS section, FileStorage upload path, logging levels |
| `appsettings.Development.json` | — | Development-specific overrides (verbose logging) |

---

### 1.10 Middleware

#### `Middleware/ExceptionMiddleware.cs`

Global exception handler that wraps the entire request pipeline. Catches unhandled exceptions and maps them to HTTP responses:

| Exception Type | HTTP Status | Behavior |
|---|---|---|
| `UnauthorizedAccessException` | 401 Unauthorized | Returns exception message |
| `KeyNotFoundException` | 404 Not Found | Returns exception message |
| `InvalidOperationException` | 400 Bad Request | Returns exception message |
| `ArgumentException` | 400 Bad Request | Returns exception message |
| Any other exception | 500 Internal Server Error | Returns generic message (hides internal details) |

Response format: `{ "statusCode": 400, "message": "..." }`

---

### 1.11 Providers

#### `Providers/UserIdProvider.cs`

Custom SignalR `IUserIdProvider` registered as singleton. Maps SignalR connections to user IDs for targeted message delivery:

```csharp
public string? GetUserId(HubConnectionContext connection)
{
    return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
        ?? connection.User?.FindFirst("sub")?.Value;
}
```

This allows `Clients.User(userId).SendAsync(...)` to target the correct WebSocket connection.

---

### 1.12 Migrations

`Migrations/` contains EF Core Code-First migration files generated by:
```bash
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

In development, `Program.cs` auto-applies pending migrations on startup via `dbContext.Database.Migrate()`.

---

## 2. Frontend Architecture

**Location:** `frontend/`  
**Framework:** Next.js 16 with App Router  
**Language:** TypeScript 5  
**State:** Zustand 5 (client) + TanStack React Query 5 (server)

### Folder Overview

```
frontend/
├── app/            # Next.js App Router: layouts, pages, route groups
├── components/     # Reusable React components
├── hooks/          # Custom hooks (auth, queries, utilities)
├── services/       # API service layer (HTTP calls)
├── lib/            # Core utilities (HTTP client, SignalR, constants)
├── providers/      # React context providers
├── store/          # Zustand state stores
├── types/          # TypeScript type definitions
└── public/         # Static assets
```

---

### 2.1 App Router & Pages

Next.js 16 uses the App Router (`app/` directory). Each folder represents a route segment. `layout.tsx` files define persistent UI (sidebars, navbars) and `page.tsx` files define page content.

#### Root Level

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root HTML layout, loads global CSS, wraps everything in `<Providers>` |
| `app/page.tsx` | Landing page (`/`) — redirects to login or dashboard based on auth state |
| `app/providers.tsx` | Composes all providers: `QueryProvider` → `ThemeProvider` → `AuthProvider` → `RealtimeProvider` → `ToastProvider` |
| `app/globals.css` | Tailwind CSS directives + custom CSS variables for theming |

#### Auth Pages — `app/auth/`

| Route | Page | Description |
|---|---|---|
| `/auth/login` | `login/page.tsx` | Email/password login form, redirects to role-specific dashboard on success |
| `/auth/register` | `register/page.tsx` | Registration form (name, email, password, phone), defaults to Patient role |
| `/auth/forgot-password` | `forgot-password/page.tsx` | Email input to request password reset link |

Auth pages are **public** — no `ProtectedRoute` wrapper.

#### Patient Pages — `app/patient/`

| File | Route | Description |
|---|---|---|
| `layout.tsx` | — | Patient layout with sidebar nav + `ProtectedRoute` allowing only `Patient` role |
| `dashboard/page.tsx` | `/patient/dashboard` | Overview: upcoming appointments, recent records, quick stats |
| `appointments/page.tsx` | `/patient/appointments` | List appointments with filter/sort; book new appointment modal |
| `doctors/page.tsx` | `/patient/doctors` | Browse/search doctors by specialization, clinic, rating, price |
| `medical-records/page.tsx` | `/patient/medical-records` | View medical records created by doctors |
| `profile/page.tsx` | `/patient/profile` | Edit profile info, change password |

#### Doctor Pages — `app/doctor/`

| File | Route | Description |
|---|---|---|
| `layout.tsx` | — | Doctor layout with sidebar nav + `ProtectedRoute` allowing only `Doctor` role |
| `dashboard/page.tsx` | `/doctor/dashboard` | Today's appointments, stats, recent patients |
| `appointments/page.tsx` | `/doctor/appointments` | View/manage appointments; approve, decline, complete |
| `schedule/page.tsx` | `/doctor/schedule` | Manage weekly availability (day-of-week + time slots) |
| `patients/page.tsx` | `/doctor/patients` | View patients who have appointments with this doctor |
| `messages/page.tsx` | `/doctor/messages` | Real-time chat with assigned secretaries (uses `ChatPage` component) |
| `profile/page.tsx` | `/doctor/profile` | Edit doctor profile, specialization, bio, pricing |

#### Secretary Pages — `app/secretary/`

| File | Route | Description |
|---|---|---|
| `layout.tsx` | — | Secretary layout + `ProtectedRoute` allowing only `Secretary` role |
| `dashboard/page.tsx` | `/secretary/dashboard` | Overview of assigned doctors, pending appointments |
| `appointments/page.tsx` | `/secretary/appointments` | Manage appointments for assigned doctors |
| `doctors/page.tsx` | `/secretary/doctors` | View assigned doctors and their schedules |
| `patients/page.tsx` | `/secretary/patients` | View patients of assigned doctors |
| `messages/page.tsx` | `/secretary/messages` | Real-time chat with assigned doctors (uses `ChatPage` component) |

#### Admin Pages — `app/admin/`

| File | Route | Description |
|---|---|---|
| `layout.tsx` | — | Admin layout + `ProtectedRoute` allowing only `Admin` role |
| `dashboard/page.tsx` | `/admin/dashboard` | System-wide statistics (total users, appointments, revenue, charts) |
| `users/page.tsx` | `/admin/users` | CRUD for all users with role filter |
| `doctors/page.tsx` | `/admin/doctors` | Manage doctor profiles, assign to clinics |
| `secretaries/page.tsx` | `/admin/secretaries` | Manage secretary profiles, assign to doctors |
| `clinics/page.tsx` | `/admin/clinics` | Clinic CRUD with working hours |
| `specializations/page.tsx` | `/admin/specializations` | Specialization CRUD |
| `settings/page.tsx` | `/admin/settings` | System settings |

---

### 2.2 Components

#### `components/ui/` — Reusable UI Primitives

| File | Component | Description |
|---|---|---|
| `button.tsx` | `Button` | Styled button with variants (primary, secondary, outline, ghost, destructive), sizes, loading state |
| `card.tsx` | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Card container compound component |
| `badge.tsx` | `Badge` | Status badges with color variants |
| `avatar.tsx` | `Avatar` | User avatar with image/fallback initials |
| `input.tsx` | `Input` | Styled text input with error state |
| `select.tsx` | `Select` | Dropdown select component |
| `calendar.tsx` | `Calendar` | Date picker calendar widget |
| `notification-bell.tsx` | `NotificationBell` | Bell icon with unread count badge + dropdown displaying recent notifications; marks as read on click |
| `index.ts` | — | Barrel export for all UI components |

#### `components/auth/`

| File | Component | Description |
|---|---|---|
| `protected-route.tsx` | `ProtectedRoute` | Auth guard wrapper. Checks `isAuthenticated` and `user.role` against `allowedRoles` prop. Shows spinner while loading. Redirects to login if unauthenticated, or to role-specific dashboard if wrong role. |
| `index.ts` | — | Barrel export |

#### `components/chat/`

| File | Component | Description |
|---|---|---|
| `chat-page.tsx` | `ChatPage` | Full messaging UI shared by doctor and secretary pages. Left panel: contact list with unread badges. Right panel: message thread with real-time updates. Handles SignalR connection (join/leave rooms), typing indicators, message sending via REST API, and read receipts. |

---

### 2.3 Hooks

#### Auth Hook

| File | Hook | Description |
|---|---|---|
| `use-auth.ts` | `useAuth()` | Exposes `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, `getDashboardRoute(role)`. Wraps Zustand store actions with navigation logic (redirects after login/logout). |

#### Utility Hooks

| File | Hook | Description |
|---|---|---|
| `use-debounce.ts` | `useDebounce(value, delay)` | Debounces a value by `delay` ms. Used for search inputs. |
| `use-media-query.ts` | `useMediaQuery(query)` | Returns boolean for CSS media query match. Used for responsive layouts. |

#### Query Hooks — `hooks/queries/`

These hooks wrap TanStack React Query for server state management. Each hook provides `useQuery` and `useMutation` patterns:

| File | Hooks Exported | API Module |
|---|---|---|
| `use-appointments.ts` | `useAppointments(filters)`, `useAppointment(id)`, `useCreateAppointment()`, `useUpdateAppointmentStatus()`, `useCancelAppointment()` | Appointment endpoints |
| `use-chat.ts` | `useChatContacts()`, `useChatConversation(userId)`, `useSendMessage()`, `useMarkMessagesRead()`, `useChatUnreadCount()` + exported `chatKeys` factory | Chat endpoints |
| `use-doctors.ts` | `useDoctors(params)`, `useDoctor(id)`, `useDoctorAvailability(id)`, `useDoctorSchedule(id)` | Doctor endpoints |
| `use-notifications.ts` | `useNotifications(params)`, `useUnreadNotificationCount()`, `useMarkNotificationRead()`, `useMarkAllNotificationsRead()` + exported `notificationKeys` factory | Notification endpoints |
| `use-specializations.ts` | `useSpecializations()`, `useSpecialization(id)` | Specialization endpoints |

**Query key factories** (e.g., `chatKeys`, `notificationKeys`) are exported so that providers can update caches directly when SignalR events arrive.

**Pattern:**
```typescript
// Query
const { data, isLoading } = useChatContacts();

// Mutation with cache invalidation
const sendMessage = useSendMessage();
sendMessage.mutate({ receiverId, content }, {
  onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversation(userId) })
});
```

---

### 2.4 Services (API Layer)

Each service file in `services/` encapsulates HTTP calls for one domain module. They import `apiClient` and `API_ENDPOINTS` from `lib/api/`.

| File | Service | Key Methods |
|---|---|---|
| `auth.service.ts` | `authService` | `login(dto)` → saves tokens + returns `LoginResponse`, `register(dto)`, `logout()` → clears tokens, `getCurrentUser()` → `GET /auth/me`, `refreshToken()`, `forgotPassword(email)`, `resetPassword(dto)` |
| `appointment.service.ts` | `appointmentService` | `getAll(filters)`, `getById(id)`, `create(dto)`, `approve(id)`, `decline(id)`, `cancel(id)`, `complete(id)`, `getAvailableSlots(doctorId, date)` |
| `chat.service.ts` | `chatService` | `getContacts()`, `getConversation(userId)`, `sendMessage(dto)`, `markAsRead(senderId)`, `getUnreadCount()` |
| `doctor.service.ts` | `doctorService` | `getAll(params)`, `getById(id)`, `getMe()`, `search(params)`, `getAvailability(id)`, `updateAvailability(id, dto)`, `getSchedule(id)` |
| `clinic.service.ts` | `clinicService` | `getAll()`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`, `search(query)` |
| `specialization.service.ts` | `specializationService` | `getAll()`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)` |
| `medical-record.service.ts` | `medicalRecordService` | `getAll()`, `getById(id)`, `getByPatient(patientId)`, `create(dto)`, `addAttachment(recordId, dto)` |
| `notification.service.ts` | `notificationService` | `getAll(params)`, `markRead(id)`, `markAllRead()`, `getUnreadCount()` |
| `file.service.ts` | `fileService` | `upload(file)`, `download(fileId)`, `delete(fileId)` |
| `secretary.service.ts` | `secretaryService` | `getMe()`, `getAssignedDoctors()`, `getPatients()`, `getDoctorAppointments(doctorId)` |
| `admin.service.ts` | `adminService` | `getUsers()`, `createUser(dto)`, `updateUser(id, dto)`, `deleteUser(id)`, `getStatistics()` |

**Convention:** Services call `apiClient.get/post/put/patch/delete` with the appropriate endpoint from `API_ENDPOINTS`. The `apiClient` automatically attaches the JWT token from `localStorage`.

---

### 2.5 Lib (Core Utilities)

#### `lib/api/client.ts` — HTTP Client

A custom `fetch`-based HTTP client (no Axios). Provides:

| Function | Purpose |
|---|---|
| `getAccessToken()` | Read JWT from `localStorage` |
| `getRefreshToken()` | Read refresh token from `localStorage` |
| `setTokens(access, refresh)` | Store both tokens |
| `clearTokens()` | Remove both tokens |
| `apiClient.get<T>(url)` | GET with auth headers |
| `apiClient.post<T>(url, data)` | POST with JSON body + auth |
| `apiClient.put<T>(url, data)` | PUT with JSON body + auth |
| `apiClient.patch<T>(url, data)` | PATCH with JSON body + auth |
| `apiClient.delete<T>(url)` | DELETE with auth |
| `apiClient.upload<T>(url, formData)` | POST multipart (no Content-Type header — browser sets boundary) |

**Error handling:** Non-2xx responses are parsed into `ApiError` objects. 401 responses clear tokens (could trigger refresh flow). All network errors are caught and wrapped.

#### `lib/api/endpoints.ts` — Endpoint Registry

Centralizes all URL construction:

- `API_ENDPOINTS`: Object with nested modules (`AUTH`, `DOCTORS`, `APPOINTMENTS`, `CHAT`, etc.). Static URLs are strings; dynamic ones are functions: `BY_ID: (id: string) => \`...\``
- `WS_HUBS`: SignalR hub URLs (`NOTIFICATIONS`, `APPOINTMENTS`, `CHAT`)
- `SIGNALR_EVENTS`: Event name constants organized by hub
- `buildUrl(base, params)`: Helper to append query parameters

#### `lib/signalr/connection.ts` — SignalR Connection Manager

Manages the lifecycle of 3 SignalR `HubConnection` instances:

| Function | Description |
|---|---|
| `connectToNotifications(handlers)` | Creates connection to `/hubs/notifications`, registers `ReceiveNotification` + `NotificationRead` handlers, starts connection |
| `connectToAppointments(handlers, options?)` | Creates connection to `/hubs/appointments`, registers event handlers, auto-joins doctor/secretary rooms |
| `connectToChat(handlers)` | Creates connection to `/hubs/chat`, registers `ReceiveMessage`, `UserTyping`, `MessagesRead`, `MessageError` handlers |
| `joinChatRoom(otherUserId)` | Invokes `JoinConversation` on the hub (for typing indicators + read receipts) |
| `leaveChatRoom(otherUserId)` | Invokes `LeaveConversation` |
| `sendChatMessage(receiverId, content)` | Invokes `SendMessage` on the hub (backup — primary path is REST) |
| `markChatMessagesRead(senderId)` | Invokes `MarkAsRead` |
| `sendTypingIndicator(receiverId)` | Invokes `SendTyping` |
| `disconnectFromNotifications()` | Stops notification hub connection |
| `disconnectFromAppointments()` | Stops appointment hub connection |
| `disconnectFromChat()` | Stops chat hub connection |
| `disconnectAll()` | Stops all 3 connections |

**Connection creation:** Uses `HubConnectionBuilder()` with:
- `.withUrl(hubUrl, { accessTokenFactory: () => getAccessToken() })` — passes JWT as query param
- `.withAutomaticReconnect()` — automatic reconnection on disconnect

#### `lib/constants.ts` — App Constants

Route path constants (`ROUTES.LOGIN`, `ROUTES.DOCTOR.DASHBOARD`, etc.), role labels, status labels, pagination defaults.

#### `lib/utils.ts` — Utility Functions

Helper functions: `cn()` (Tailwind class merger using `clsx` + `tailwind-merge`), date formatters, name formatters, etc.

---

### 2.6 Providers

Providers wrap the app tree to provide global context. Composed in `app/providers.tsx`:

```
QueryProvider → ThemeProvider → AuthProvider → RealtimeProvider → ToastProvider → {children}
```

| File | Provider | Responsibility |
|---|---|---|
| `query-provider.tsx` | `QueryProvider` | Wraps `QueryClientProvider` from TanStack React Query with default config (staleTime, retry, refetchOnWindowFocus) |
| `theme-provider.tsx` | `ThemeProvider` | Dark/light mode theme management |
| `auth-provider.tsx` | `AuthProvider` | On mount, calls `useAuthStore.initialize()` which checks for stored token and fetches user from API. Shows loading spinner until `isInitialized` is true. |
| `realtime-provider.tsx` | `RealtimeProvider` | When user is authenticated, connects to the **Notifications SignalR hub**. On `ReceiveNotification`: updates notification list cache + bumps unread count cache + if type is `chat_message`, also invalidates chat contacts/unread caches. Disconnects on unmount or logout. |
| `toast-provider.tsx` | `ToastProvider` | Provides Sonner `<Toaster>` component for toast notifications |

---

### 2.7 Store (State Management)

Uses **Zustand** for lightweight client state:

#### `store/auth.store.ts` — Authentication Store

| State | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current authenticated user (fetched from API) |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `isLoading` | `boolean` | Auth operation in progress |
| `isInitialized` | `boolean` | Initial auth check completed (prevents flash) |

| Action | Description |
|---|---|
| `initialize()` | Checks `localStorage` for token → if exists, calls `GET /auth/me` to hydrate user. If token is invalid, clears it. Only runs once. |
| `login(credentials)` | Calls `authService.login()` → stores tokens → sets user |
| `register(data)` | Calls `authService.register()` → stores tokens → sets user |
| `logout()` | Calls `authService.logout()` → clears tokens → resets state |
| `setUser(user)` | Manually set user (used after profile updates) |
| `reset()` | Clear everything |

**Key design:** Only the JWT token is persisted (`localStorage`). The `User` object is **always fetched from the API** on initialization — this ensures the user data is fresh and matches the server.

#### `store/ui.store.ts` — UI State Store

Manages client-only UI state: sidebar open/collapsed, mobile menu visibility, theme preference.

---

### 2.8 Types

#### `types/index.ts` — Central Type Definitions

All TypeScript interfaces and enums in a single file. Maps 1:1 with backend DTOs:

| Category | Types |
|---|---|
| **Enums** | `UserRole`, `ConsultationType`, `AppointmentType`, `AppointmentStatus`, `DayOfWeek` |
| **User** | `User`, `UserCreateDto`, `UserUpdateDto` |
| **Auth** | `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RefreshTokenRequest`, `AuthState` |
| **Doctor** | `Doctor`, `DoctorCreateDto`, `DoctorUpdateDto`, `DoctorSearchParams` |
| **Specialization** | `Specialization`, `SpecializationCreateDto`, `SpecializationUpdateDto` |
| **Availability** | `DoctorAvailability`, `DoctorAvailabilityCreateDto`, `TimeSlot` |
| **Appointment** | `Appointment`, `AppointmentCreateDto`, `AppointmentUpdateDto`, `AppointmentRescheduleDto`, `AppointmentFilterParams` |
| **Clinic** | `Clinic`, `ClinicCreateDto`, `GeoLocation`, `WorkingHours`, `ContactInfo` |
| **Medical Records** | `MedicalRecord`, `MedicalRecordCreateDto`, `MedicalRecordUpdateDto`, `MedicalRecordAttachment`, `VitalSigns`, `AddAttachmentDto` |
| **Secretary** | `SecretaryProfile` |
| **Notification** | `Notification` |
| **Chat** | `ChatMessage`, `SendMessageDto`, `ChatConversation` |
| **API** | `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `FileUploadResponse` |

---

## 3. API Consumption Flow

The frontend consumes the backend REST API through a layered architecture:

```
Page/Component
    ↓ uses
React Query Hook (hooks/queries/use-*.ts)
    ↓ calls
Service (services/*.service.ts)
    ↓ uses
API Client (lib/api/client.ts)
    ↓ fetches
API Endpoints (lib/api/endpoints.ts)
    ↓ HTTP
Backend REST Controller
```

### Step-by-Step Example: Fetching Chat Contacts

1. **Component**: `<ChatPage />` calls `useChatContacts()` hook
2. **Hook** (`hooks/queries/use-chat.ts`):
   ```typescript
   export function useChatContacts() {
     return useQuery({
       queryKey: chatKeys.contacts(),
       queryFn: () => chatService.getContacts(),
     });
   }
   ```
3. **Service** (`services/chat.service.ts`):
   ```typescript
   async getContacts(): Promise<ChatConversation[]> {
     return apiClient.get(API_ENDPOINTS.CHAT.CONTACTS);
   }
   ```
4. **Client** (`lib/api/client.ts`):
   - Builds `Headers` with `Content-Type: application/json` and `Authorization: Bearer <token>`
   - Calls `fetch(url, { method: 'GET', headers })`
   - Parses JSON response
   - On 401: clears tokens
5. **Endpoint** (`lib/api/endpoints.ts`):
   - `CHAT.CONTACTS` resolves to `http://localhost:5155/api/chat/contacts`

### Cache Management

- **React Query** caches responses by query key (e.g., `['chat', 'contacts']`)
- **Mutations** (create, update, delete) invalidate related query keys on success
- **SignalR events** in `RealtimeProvider` directly mutate or invalidate caches when real-time updates arrive
- This creates a **single source of truth**: REST API is the primary data source, SignalR pushes trigger cache updates

---

## 4. SignalR Real-Time System

### Overview

HealthFlow uses **3 independent SignalR hubs** for different real-time concerns:

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────┐
│  Frontend     │────►│  /hubs/notifications │◄────│  Backend     │
│  (SignalR     │     └────────────────────┘     │  Services    │
│   Client)     │────►│  /hubs/appointments  │◄────│  (via        │
│               │     └────────────────────┘     │  IHubContext) │
│               │────►│  /hubs/chat          │◄────│              │
└──────────────┘     └────────────────────┘     └──────────────┘
```

### Connection Lifecycle

1. **User logs in** → `AuthProvider` sets user in Zustand store
2. **`RealtimeProvider`** detects `user` change → calls `connectToNotifications(handlers)`
3. `connectToNotifications` creates `HubConnection` with JWT access token factory
4. Connection starts → server authenticates via JWT query param → `UserIdProvider` extracts user ID
5. Hub is ready — server can push to this user via `Clients.User(userId).SendAsync(...)`
6. **User navigates to chat page** → `ChatPage` connects to chat hub + joins conversation room
7. **User logs out** → `RealtimeProvider` cleanup disconnects notification hub; `ChatPage` cleanup disconnects chat hub

### Hub Details

#### Notification Hub (`/hubs/notifications`)

**Connected globally** via `RealtimeProvider` (active on every page when authenticated).

| Direction | Event | Payload | When |
|---|---|---|---|
| Server→Client | `ReceiveNotification` | `Notification` object | New notification created (appointment status change, new message, etc.) |
| Server→Client | `NotificationRead` | `string` notificationId | Notification marked as read |

**Frontend handling in `RealtimeProvider`:**
- `ReceiveNotification`: Prepends to notification list cache, increments unread count, if `type === 'chat_message'` also invalidates chat caches
- `NotificationRead`: Updates notification's `isRead` in cache, refreshes unread count

#### Appointment Hub (`/hubs/appointments`)

**Connected per-page** by appointment-related pages.

| Direction | Event | Payload | When |
|---|---|---|---|
| Server→Client | `AppointmentStatusChanged` | `Appointment` object | Status transitions (approve, decline, cancel, complete) |
| Server→Client | `NewAppointmentRequest` | `Appointment` object | Patient books a new appointment |
| Server→Client | `AppointmentCancelled` | `string` appointmentId | Appointment cancelled |
| Server→Client | `AppointmentReminder` | `Appointment` object | Upcoming appointment reminder |
| Client→Server | `JoinDoctorRoom` | `string` doctorId | Doctor joins their appointment room |
| Client→Server | `JoinGroup` | `string` groupName | Join a named room (e.g., `secretary_{id}`) |

#### Chat Hub (`/hubs/chat`)

**Connected per-page** by the `ChatPage` component.

| Direction | Event | Payload | When |
|---|---|---|---|
| Server→Client | `ReceiveMessage` | `ChatMessage` object | New message from another user |
| Server→Client | `UserTyping` | `{ userId: string }` | Other user is typing |
| Server→Client | `MessagesRead` | `{ readBy: string }` | Other user read your messages |
| Server→Client | `MessageError` | `{ error: string }` | Message send failed |
| Client→Server | `JoinConversation` | `string` otherUserId | Creates/joins room `chat_{minId}_{maxId}` |
| Client→Server | `LeaveConversation` | `string` otherUserId | Leaves conversation room |
| Client→Server | `SendTyping` | `string` receiverId | Broadcast typing indicator to room |
| Client→Server | `MarkAsRead` | `string` senderId | Mark messages as read + broadcast |

### Message Flow (Chat)

```
Doctor types message → clicks Send
    ↓
Frontend calls POST /api/chat/send (REST)
    ↓
ChatController → ChatService.SendMessage()
    ↓
ChatService saves ChatMessage to database
    ↓
ChatService uses IHubContext<ChatHub> to push ReceiveMessage to receiver
    ↓
ChatService uses IHubContext<NotificationHub> to push ReceiveNotification to receiver
    ↓
Secretary's ChatPage receives ReceiveMessage → appends to conversation cache
Secretary's RealtimeProvider receives ReceiveNotification → bumps badge count
```

---

## 5. Authentication & Authorization

### Overview

HealthFlow uses **JWT Bearer authentication** with access + refresh token pattern.

### Token Flow

```
┌─────────┐  POST /api/auth/login   ┌──────────┐
│ Frontend │ ────────────────────────►│ Backend  │
│          │  { email, password }     │          │
│          │                          │          │
│          │ ◄────────────────────────│          │
│          │  { accessToken,          │          │
│          │    refreshToken, user }  │          │
└─────────┘                          └──────────┘
     │
     ▼
  localStorage:
  - accessToken (JWT, 60 min)
  - refreshToken (opaque, 7 days)
```

### Backend Auth Implementation

#### Registration (`POST /api/auth/register`)
1. Validate input (email uniqueness, password strength)
2. Hash password with BCrypt (`BCrypt.Net.BCrypt.HashPassword`)
3. Create `User` entity with `Role = UserRole.Patient` (default)
4. Generate JWT access token (60 min) + refresh token (7 days)
5. Store refresh token in User entity
6. Return `{ accessToken, refreshToken, user, expiresIn }`

#### Login (`POST /api/auth/login`)
1. Find user by email
2. Verify password with `BCrypt.Net.BCrypt.Verify`
3. Generate new JWT + refresh token pair
4. Return `{ accessToken, refreshToken, user, expiresIn }`

#### JWT Token Structure
```json
{
  "sub": "<user-guid>",    // ClaimTypes.NameIdentifier
  "email": "user@email.com",
  "role": "Doctor",         // ClaimTypes.Role
  "iss": "HealthFlow",
  "aud": "HealthFlowClient",
  "exp": 1234567890,        // 60 minutes from issue
  "iat": 1234567890
}
```

#### Token Validation (every request)
Configured in `Program.cs` → `AddJwtBearer()`:
- Validate Issuer = "HealthFlow"
- Validate Audience = "HealthFlowClient"
- Validate Lifetime (expiration)
- Validate IssuerSigningKey (HMAC-SHA256)
- `ClockSkew = TimeSpan.Zero` (strict expiration)
- `RoleClaimType = ClaimTypes.Role` (enables `[Authorize(Roles = "...")]`)

#### Role-Based Authorization
Controllers use `[Authorize]` and `[Authorize(Roles = "Doctor,Admin")]` attributes:
- `[Authorize]` → any authenticated user
- `[Authorize(Roles = "Admin")]` → admin only
- `[Authorize(Roles = "Doctor,Secretary")]` → doctor or secretary

### Frontend Auth Implementation

#### Token Storage
Tokens are stored in `localStorage` via `lib/api/client.ts`:
- `setTokens(accessToken, refreshToken)` — called after login/register
- `getAccessToken()` — called by every API request
- `clearTokens()` — called on logout or 401 response

#### Auth State Management (`store/auth.store.ts`)
The Zustand store manages auth state with a **token-first** approach:

1. **App loads** → `AuthProvider` calls `store.initialize()`
2. `initialize()` checks `localStorage` for token:
   - **No token** → Sets `isAuthenticated: false, isInitialized: true`
   - **Token exists** → Calls `GET /api/auth/me` to verify token and get fresh user data
     - **Success** → Sets `user`, `isAuthenticated: true`
     - **Failure** (expired/invalid) → Clears tokens, sets `isAuthenticated: false`
3. `isInitialized` flag prevents flash-of-content before auth state is known

#### Protected Routes (`components/auth/protected-route.tsx`)

Wraps role-restricted pages. Behavior:

1. If `!isInitialized || isLoading` → Show spinner (prevent flash)
2. If `!isAuthenticated` → Redirect to `/auth/login?redirect=<currentPath>`
3. If `allowedRoles` specified and user's role isn't in the list → Redirect to user's role-specific dashboard
4. Otherwise → Render children

Usage in layouts:
```tsx
// app/doctor/layout.tsx
<ProtectedRoute allowedRoles={[UserRole.Doctor]}>
  <DoctorSidebar />
  {children}
</ProtectedRoute>
```

#### SignalR Authentication

SignalR WebSocket connections cannot send HTTP headers, so JWT is passed via **query parameter**:

**Frontend** (`lib/signalr/connection.ts`):
```typescript
new HubConnectionBuilder()
  .withUrl(hubUrl, {
    accessTokenFactory: () => getAccessToken() ?? '',
  })
```

**Backend** (`Program.cs` → `JwtBearerEvents.OnMessageReceived`):
```csharp
OnMessageReceived = context =>
{
    var accessToken = context.Request.Query["access_token"];
    var path = context.HttpContext.Request.Path;
    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
    {
        context.Token = accessToken;  // Use query param as JWT
    }
    return Task.CompletedTask;
};
```

The `UserIdProvider` then extracts the user ID from the authenticated connection's claims to enable `Clients.User(userId).SendAsync(...)`.

### Auth Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        App Startup                             │
│                                                                │
│  1. AuthProvider mounts                                        │
│  2. Calls store.initialize()                                   │
│  3. Checks localStorage for token                              │
│     ├─ No token → isAuthenticated=false, show login            │
│     └─ Token found → GET /api/auth/me                          │
│         ├─ 200 OK → user hydrated, isAuthenticated=true        │
│         │   └─ RealtimeProvider connects SignalR               │
│         └─ 401 → clearTokens(), isAuthenticated=false          │
│  4. ProtectedRoute checks role → render page or redirect       │
│                                                                │
│  Every API call:                                               │
│    apiClient reads token from localStorage                     │
│    → Attaches Authorization: Bearer <token>                    │
│    → If 401 response → clearTokens()                           │
│                                                                │
│  Every SignalR connection:                                      │
│    accessTokenFactory returns token from localStorage           │
│    → Passed as ?access_token=<token> query param               │
│    → Backend JwtBearerEvents.OnMessageReceived reads it         │
│    → UserIdProvider maps connection to user ID                  │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Layer | Technology | Pattern |
|---|---|---|
| **Database** | PostgreSQL (Neon) | EF Core Code-First, auto-migrations |
| **Data Access** | Repository + Unit of Work | Generic `IRepository<T>`, lazy-init UoW |
| **Business Logic** | Service classes | 1 service per domain; injected via DI as Scoped |
| **API** | ASP.NET Core Controllers | RESTful, JWT auth, role-based authorization |
| **Real-Time** | SignalR (3 hubs) | Notification broadcast, appointment updates, room-based chat |
| **Frontend State** | Zustand (client) + React Query (server) | Token in localStorage, user from API, cache invalidation via SignalR |
| **HTTP Client** | Custom fetch wrapper | Auto-attaches JWT, error normalization, file uploads |
| **Auth** | JWT Bearer + BCrypt | 60-min access token, 7-day refresh, query param for WS |
| **UI** | Next.js 16 App Router + Tailwind CSS 4 | Role-based layouts, ProtectedRoute guard, responsive design |
