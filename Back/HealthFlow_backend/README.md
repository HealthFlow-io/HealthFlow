# HealthFlow Backend API

A comprehensive .NET 8 Web API for a healthcare management system that provides endpoints for managing doctors, patients, appointments, clinics, and more.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for multiple roles (Admin, Doctor, Secretary, Patient, ClinicManager)
- **Doctor Management**: Doctor profiles, specializations, availability, and ratings
- **Appointment System**: Full appointment lifecycle management with status tracking
- **Clinic Management**: Clinic profiles with working hours and geolocation
- **Medical Records**: Secure medical record management
- **Real-time Notifications**: SignalR hubs for instant notifications and appointment updates
- **File Upload**: Secure file upload and download capabilities

## 📁 Project Structure

```
HealthFlow_backend/
├── Configuration/          # Configuration classes (JWT, CORS settings)
├── Controllers/            # API Controllers
│   ├── AdminController.cs
│   ├── AppointmentsController.cs
│   ├── AuthController.cs
│   ├── ClinicsController.cs
│   ├── DoctorsController.cs
│   ├── FilesController.cs
│   ├── MedicalRecordsController.cs
│   ├── NotificationsController.cs
│   └── SpecializationsController.cs
├── Data/                   # Database context
│   └── ApplicationDbContext.cs
├── DTOs/                   # Data Transfer Objects
│   ├── Admin/
│   ├── Appointments/
│   ├── Auth/
│   ├── Clinics/
│   ├── Common/
│   ├── Doctors/
│   ├── MedicalRecords/
│   ├── Notifications/
│   ├── Secretaries/
│   └── Specializations/
├── Hubs/                   # SignalR Hubs
│   ├── AppointmentHub.cs
│   └── NotificationHub.cs
├── Middleware/             # Custom middleware
│   └── ExceptionMiddleware.cs
├── Models/                 # Entity models
│   ├── Entities/
│   └── Enums/
├── Providers/              # Custom providers
│   └── UserIdProvider.cs
├── Repositories/           # Repository pattern
│   ├── Implementations/
│   └── Interfaces/
└── Services/               # Business logic services
    ├── Implementations/
    └── Interfaces/
```

## 🛠️ Technologies

- **.NET 8** - Latest LTS version of .NET
- **Entity Framework Core 8** - ORM for database operations
- **MySQL** (via Pomelo.EntityFrameworkCore.MySql) - Database
- **JWT Authentication** - Secure token-based authentication
- **SignalR** - Real-time communication
- **BCrypt.Net** - Password hashing
- **Swagger/OpenAPI** - API documentation

## 📋 Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (8.0 or later)
- [Visual Studio 2022](https://visualstudio.microsoft.com/) or [VS Code](https://code.visualstudio.com/)

## ⚙️ Configuration

### 1. Database Connection

Update the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=healthflow_db;User=root;Password=your_password;"
  }
}
```

### 2. JWT Settings

Configure JWT authentication in `appsettings.json`:

```json
{
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong!",
    "Issuer": "HealthFlow",
    "Audience": "HealthFlowClient",
    "ExpirationMinutes": 60
  }
}
```

> ⚠️ **Important**: Change the `SecretKey` to a secure value in production!

### 3. CORS Settings

Configure allowed origins for the frontend:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000"
    ]
  }
}
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/HealthFlow.git
cd HealthFlow/Back/HealthFlow_backend/HealthFlow_backend
```

### 2. Restore packages

```bash
dotnet restore
```

### 3. Create the database

Make sure MySQL is running, then create the database:

```sql
CREATE DATABASE healthflow_db;
```

### 4. Apply migrations

```bash
dotnet ef database update
```

Or create a new migration if needed:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run the application

```bash
dotnet run
```

The API will be available at:
- **HTTP**: http://localhost:5155
- **HTTPS**: https://localhost:7155

### 6. Access Swagger UI

Open your browser and navigate to:
```
http://localhost:5155/swagger
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | User login |
| POST | `/register` | User registration |
| POST | `/logout` | User logout |
| POST | `/refresh-token` | Refresh access token |
| GET | `/me` | Get current user |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| POST | `/change-password` | Change password |

### Doctors (`/api/doctors`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all doctors |
| GET | `/{id}` | Get doctor by ID |
| GET | `/search` | Search doctors |
| GET | `/specialization/{id}` | Get doctors by specialization |
| GET | `/clinic/{id}` | Get doctors by clinic |
| GET | `/{id}/availability` | Get doctor availability |
| GET | `/{id}/schedule` | Get available time slots |
| GET | `/{id}/ratings` | Get doctor ratings |
| POST | `/` | Create doctor (Admin) |
| PUT | `/{id}` | Update doctor |
| DELETE | `/{id}` | Delete doctor (Admin) |

### Appointments (`/api/appointments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{id}` | Get appointment by ID |
| GET | `/patient/{id}` | Get patient appointments |
| GET | `/doctor/{id}` | Get doctor appointments |
| GET | `/doctor/{id}/available-slots` | Get available slots |
| POST | `/` | Create appointment |
| POST | `/{id}/approve` | Approve appointment |
| POST | `/{id}/decline` | Decline appointment |
| POST | `/{id}/cancel` | Cancel appointment |
| POST | `/{id}/reschedule` | Reschedule appointment |
| POST | `/{id}/complete` | Mark as complete |

### Clinics (`/api/clinics`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all clinics |
| GET | `/{id}` | Get clinic by ID |
| GET | `/search` | Search clinics |
| GET | `/nearby` | Get nearby clinics |
| POST | `/` | Create clinic |
| PUT | `/{id}` | Update clinic |
| DELETE | `/{id}` | Delete clinic (Admin) |

### Specializations (`/api/specializations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all specializations |
| GET | `/{id}` | Get by ID |
| GET | `/category/{category}` | Get by category |
| POST | `/` | Create (Admin) |
| PUT | `/{id}` | Update (Admin) |
| DELETE | `/{id}` | Delete (Admin) |

### Medical Records (`/api/medical-records`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{id}` | Get record by ID |
| GET | `/patient/{id}` | Get patient records |
| GET | `/doctor/{id}` | Get doctor records |
| POST | `/` | Create record (Doctor) |
| PUT | `/{id}` | Update record |
| DELETE | `/{id}` | Delete record |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user notifications |
| GET | `/unread-count` | Get unread count |
| POST | `/{id}/read` | Mark as read |
| POST | `/read-all` | Mark all as read |
| DELETE | `/{id}` | Delete notification |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/statistics` | Get system statistics |
| GET | `/users` | Get all users |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |

## 🔌 SignalR Hubs

### Notification Hub (`/hubs/notifications`)
- Real-time notification delivery
- User-specific notifications
- Group-based notifications

### Appointment Hub (`/hubs/appointments`)
- Real-time appointment status updates
- Doctor-specific rooms for appointment management

### Connection Example (Frontend)

```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl('http://localhost:5155/hubs/notifications', {
    accessTokenFactory: () => localStorage.getItem('accessToken')
  })
  .withAutomaticReconnect()
  .build();

connection.on('ReceiveNotification', (notification) => {
  console.log('New notification:', notification);
});

await connection.start();
```

## 🔐 User Roles

| Role | Description |
|------|-------------|
| `Admin` | Full system access |
| `Doctor` | Manage appointments, medical records |
| `Secretary` | Assist doctors with appointments |
| `Patient` | Book appointments, view records |
| `ClinicManager` | Manage clinic details |

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5155/health
```

### Database Connection Test
```bash
curl http://localhost:5155/db-test
```

## 📦 Deployment

### Production Configuration

1. Update `appsettings.Production.json` with production values
2. Use environment variables for sensitive data:
   ```bash
   export ConnectionStrings__DefaultConnection="your_prod_connection"
   export Jwt__SecretKey="your_production_secret_key"
   ```

### Docker Support (Optional)

Create a `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HealthFlow_backend.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HealthFlow_backend.dll"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions or support, please open an issue on GitHub.
