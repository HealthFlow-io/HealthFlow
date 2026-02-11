# 🏥 HealthFlow — Medical Consultation Platform

HealthFlow is a full-stack healthcare management platform that connects **patients**, **doctors**, **secretaries**, and **administrators** through a unified web application. It supports appointment booking (physical & online), real-time messaging, medical records, schedule management, and in-app notifications — all powered by a .NET 8 REST API with SignalR real-time capabilities and a Next.js 16 React frontend.

---

## Table of Contents

- [🏥 HealthFlow — Medical Consultation Platform](#-healthflow--medical-consultation-platform)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Architecture Overview](#architecture-overview)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
    - [Backend — `appsettings.json`](#backend--appsettingsjson)
    - [Frontend — `.env.local`](#frontend--envlocal)
  - [Database](#database)
  - [API Documentation](#api-documentation)
    - [Key Endpoint Groups](#key-endpoint-groups)
  - [Project Structure](#project-structure)
  - [User Roles](#user-roles)
  - [Real-Time Features](#real-time-features)
    - [Chat Architecture](#chat-architecture)
  - [License](#license)

---

## Features

| Module | Highlights |
|---|---|
| **Authentication** | JWT-based login/register, role-based access, refresh tokens, forgot/reset password |
| **Patient Portal** | Browse doctors by specialization/clinic, book appointments (physical or online), view medical records, manage profile |
| **Doctor Portal** | Manage weekly schedule & availability, view appointments, write medical records, real-time chat with secretaries |
| **Secretary Portal** | Manage appointments on behalf of doctors, view patient info, real-time chat with assigned doctors |
| **Admin Panel** | Full CRUD for users, doctors, secretaries, clinics, specializations; dashboard statistics |
| **Real-Time Chat** | Doctor ↔ Secretary messaging via SignalR rooms, unread badges, typing indicators |
| **Notifications** | In-app notification bell with live badge count, real-time push via SignalR, notification history |
| **Appointments** | Create, approve, decline, cancel, complete workflow; real-time status updates |
| **Medical Records** | Create/view records per patient with file attachments |
| **File Uploads** | Profile pictures, medical record attachments, secure file storage |

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **.NET 8 / ASP.NET Core** | REST API framework |
| **Entity Framework Core 8** | ORM / database access |
| **PostgreSQL (Neon)** | Cloud relational database |
| **SignalR** | Real-time WebSocket communication |
| **JWT Bearer** | Authentication & authorization |
| **BCrypt** | Password hashing |
| **Swagger / Swashbuckle** | API documentation |
| **Bogus** | Database seeding with realistic fake data |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **TanStack React Query 5** | Server state management & caching |
| **Zustand 5** | Client state management (auth, UI) |
| **@microsoft/signalr** | Real-time WebSocket client |
| **Sonner** | Toast notifications |

---

## Architecture Overview

```
┌─────────────────┐          ┌──────────────────────┐
│   Next.js 16    │  REST    │   ASP.NET Core 8     │
│   Frontend      │◄────────►│   Web API            │
│   (Port 3000)   │  HTTP    │   (Port 5155)        │
│                 │          │                      │
│  React Query    │ SignalR  │  EF Core 8           │
│  Zustand        │◄═══════►│  Repository/UoW      │
│  SignalR Client │ WebSocket│  JWT Auth             │
└─────────────────┘          └──────────┬───────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   PostgreSQL      │
                              │   (Neon Cloud)    │
                              └──────────────────┘
```

- **API Communication**: REST endpoints (`/api/*`) for CRUD operations
- **Real-Time**: SignalR hubs (`/hubs/notifications`, `/hubs/appointments`, `/hubs/chat`)
- **Auth**: JWT tokens passed via `Authorization: Bearer <token>` header (REST) and `access_token` query param (SignalR)

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (or a [Neon](https://neon.tech/) cloud database)

### Backend Setup

```bash
cd Back/HealthFlow_backend

# Restore dependencies
dotnet restore

# Apply database migrations
dotnet ef database update --project HealthFlow_backend

# (Optional) Seed the database with sample data
dotnet run --project HealthFlow_backend -- seed

# Start the API server
dotnet run --project HealthFlow_backend
```

The API will be available at `http://localhost:5155`.
Swagger UI is at `http://localhost:5155/swagger`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend — `appsettings.json`

| Key | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Jwt:SecretKey` | Secret key for signing JWT tokens (min 32 chars) |
| `Jwt:Issuer` | Token issuer (`HealthFlow`) |
| `Jwt:Audience` | Token audience (`HealthFlowClient`) |
| `Jwt:ExpirationMinutes` | Access token lifetime (default: `60`) |
| `Cors:AllowedOrigins` | Array of allowed frontend origins |
| `FileStorage:UploadPath` | Directory for uploaded files (`Uploads`) |

### Frontend — `.env.local`

| Key | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL (e.g., `http://localhost:5155/api`) |
| `NEXT_PUBLIC_WS_URL` | Backend SignalR hub base URL (e.g., `http://localhost:5155/hubs`) |

---

## Database

HealthFlow uses **PostgreSQL** with EF Core Code-First migrations. The schema includes:

| Entity | Description |
|---|---|
| `User` | All users (patients, doctors, secretaries, admins) with role-based fields |
| `Doctor` | Doctor profile (linked to User), specialization, clinic, bio, etc. |
| `SecretaryProfile` | Secretary profile linked to one or more doctors via `SecretaryDoctor` |
| `Appointment` | Patient ↔ Doctor appointment with status workflow |
| `DoctorAvailability` | Weekly time-slot schedule for doctors |
| `Clinic` | Clinic details with working hours and geolocation |
| `Specialization` | Medical specializations (Cardiology, Neurology, etc.) |
| `MedicalRecord` | Patient medical records created by doctors |
| `ChatMessage` | Direct messages between doctors and secretaries |
| `Notification` | In-app notifications for all users |
| `FileUpload` | Uploaded file metadata (profile pictures, attachments) |
| `DoctorRating` | Patient ratings/reviews for doctors |

To seed the database with realistic sample data:

```bash
cd Back/HealthFlow_backend
dotnet run --project HealthFlow_backend -- seed
```

---

## API Documentation

When the backend is running, visit **Swagger UI** at:

```
http://localhost:5155/swagger
```

### Key Endpoint Groups

| Route Prefix | Controller | Description |
|---|---|---|
| `/api/auth` | AuthController | Register, login, refresh token, forgot/reset password |
| `/api/doctors` | DoctorsController | Doctor profiles, search, availability, schedule, ratings |
| `/api/appointments` | AppointmentsController | CRUD, status transitions, patient/doctor views |
| `/api/chat` | ChatController | Contacts list, conversations, send messages, unread counts |
| `/api/notifications` | NotificationsController | List, mark read, unread count |
| `/api/clinics` | ClinicsController | CRUD for clinics |
| `/api/specializations` | SpecializationsController | CRUD for specializations |
| `/api/medical-records` | MedicalRecordsController | Create/view medical records |
| `/api/files` | FilesController | Upload/download/delete files |
| `/api/admin` | AdminController | Admin CRUD for users, doctors, secretaries, stats |
| `/api/secretaries` | SecretariesController | Secretary-specific operations |

---

## Project Structure

```
HealthFlow/
├── Back/HealthFlow_backend/          # .NET 8 Backend
│   └── HealthFlow_backend/
│       ├── Program.cs                # Application entry point & DI configuration
│       ├── Controllers/              # REST API controllers (11 controllers)
│       ├── Models/
│       │   ├── Entities/             # EF Core entity classes (14 entities)
│       │   └── Enums/                # UserRole, AppointmentStatus, etc.
│       ├── DTOs/                     # Data Transfer Objects per module
│       ├── Services/
│       │   ├── Interfaces/           # Service contracts (11 interfaces)
│       │   └── Implementations/      # Business logic (10 services)
│       ├── Repositories/
│       │   ├── Interfaces/           # Repository contracts + IUnitOfWork
│       │   └── Implementations/      # EF Core repositories + UnitOfWork
│       ├── Hubs/                     # SignalR hubs (Notification, Appointment, Chat)
│       ├── Data/                     # DbContext + DatabaseSeeder
│       ├── Configuration/            # JwtSettings, CorsSettings
│       ├── Middleware/               # Global exception handler
│       ├── Providers/                # SignalR UserIdProvider
│       └── Migrations/               # EF Core database migrations
│
├── frontend/                         # Next.js 16 Frontend
│   ├── app/                          # App Router pages & layouts
│   │   ├── layout.tsx                # Root layout
│   │   ├── providers.tsx             # Provider composition
│   │   ├── auth/                     # Login, Register, Forgot Password pages
│   │   ├── admin/                    # Admin panel (dashboard, users, doctors, etc.)
│   │   ├── doctor/                   # Doctor portal (dashboard, appointments, schedule, chat)
│   │   ├── secretary/                # Secretary portal (dashboard, appointments, chat)
│   │   └── patient/                  # Patient portal (dashboard, appointments, records)
│   ├── components/
│   │   ├── ui/                       # Reusable UI components (Button, Card, Badge, etc.)
│   │   ├── auth/                     # ProtectedRoute component
│   │   └── chat/                     # Shared ChatPage component
│   ├── hooks/
│   │   ├── use-auth.ts               # Auth hook (login, register, logout)
│   │   └── queries/                  # React Query hooks (appointments, chat, doctors, etc.)
│   ├── services/                     # API service layer (REST calls per module)
│   ├── lib/
│   │   ├── api/                      # HTTP client, endpoints config
│   │   └── signalr/                  # SignalR connection manager
│   ├── providers/                    # React providers (Auth, Query, Theme, Realtime, Toast)
│   ├── store/                        # Zustand stores (auth, UI)
│   └── types/                        # TypeScript type definitions
│
├── README.md                         # This file
└── ARCHITECTURE.md                   # Detailed architecture documentation
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **Patient** | Browse doctors, book appointments, view medical records, manage profile |
| **Doctor** | Manage schedule, view/manage appointments, create medical records, chat with secretaries |
| **Secretary** | Manage appointments for assigned doctors, view patients, chat with assigned doctors |
| **Admin** | Full system management — users, doctors, secretaries, clinics, specializations |

---

## Real-Time Features

HealthFlow uses **SignalR** for three real-time channels:

| Hub | Endpoint | Purpose |
|---|---|---|
| **NotificationHub** | `/hubs/notifications` | Push notifications to users instantly |
| **AppointmentHub** | `/hubs/appointments` | Live appointment status updates |
| **ChatHub** | `/hubs/chat` | Doctor ↔ Secretary real-time messaging with room-based architecture |

### Chat Architecture
- **Sending**: REST API `POST /api/chat/send` → saves to DB → pushes `ReceiveMessage` to receiver via SignalR
- **Rooms**: `JoinConversation` / `LeaveConversation` for typing indicators and read receipts
- **Notifications**: Push notification sent to receiver + in-app notification badge

---

## License

This project is for educational and portfolio purposes.
