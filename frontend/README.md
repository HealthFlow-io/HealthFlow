# 🏥 Medical Consultation Reservation Platform – Frontend

A modern **medical consultation reservation platform frontend** built with **Next.js**.
This application allows patients to book consultations with doctors (physical or online), while doctors and secretaries manage and approve reservations through dedicated dashboards.

---

## 📌 Project Overview

This frontend application is part of a full-stack system designed to **simplify medical appointment scheduling** and **enable online consultations** using video meeting platforms such as **Google Meet**.

The system supports multiple user roles, real-time updates, and a responsive user interface optimized for both desktop and mobile devices.

---

## 🎯 Objectives

* Help patients easily **find doctors and book consultations**
* Allow doctors and secretaries to **review, approve, decline, or reschedule appointments**
* Support **online consultations** via video meeting links
* Provide role-based dashboards for different users
* Offer a scalable and maintainable frontend architecture

---

## 👥 User Roles & Access

| Role                       | Description                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| **Patient**                | Search doctors, book consultations, view history, join online sessions    |
| **Doctor**                 | Manage availability, approve or decline reservations, view daily schedule |
| **Secretary**              | Manage clinic schedules, validate appointments, assist doctors            |
| **Admin**                  | Manage users, doctors, clinics, and system configuration                  |
| **Super Admin (optional)** | Platform-level management and global settings                             |

---

## 🩺 Key Features

### Patient Features

* Doctor search by specialization and availability
* Physical or online consultation booking
* Reservation tracking (pending, approved, declined)
* Online consultation access (Google Meet link)
* Appointment history

### Doctor Features

* Personal dashboard
* Daily and weekly schedule
* Reservation approval / decline / reschedule
* Availability management
* Online consultation access

### Secretary Features

* Clinic-wide appointment management
* Reservation validation
* Doctor schedule coordination
* Patient communication support

### Admin Features

* User and role management
* Doctor and specialization management
* Clinic configuration
* Platform monitoring

---

## 🔁 Reservation Workflow

1. Patient selects a doctor and requests a consultation
2. Reservation is created with **PENDING** status
3. Doctor or secretary reviews the request
4. Reservation is **APPROVED**, **DECLINED**, or **RESCHEDULED**
5. For online consultations, a video meeting link is generated
6. Patient joins the consultation at the scheduled time

---

## 🖥️ Technology Stack

### Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **Shadcn/UI**
* **React Query (TanStack Query)**
* **Zustand / Redux (state management)**
* **WebSockets / SignalR (real-time updates)**

### Backend (External)

* **ASP.NET Core Web API**
* **JWT Authentication**
* **Role-Based Access Control (RBAC)**

---

## 📁 Project Structure

```bash
src/
│
├── app/                # Next.js App Router
├── components/         # Reusable UI components
├── features/           # Feature-based modules (auth, reservations, doctors)
├── services/           # API calls and HTTP clients
├── store/              # Global state management
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── styles/             # Global styles
└── types/              # TypeScript types and interfaces
```

---

## 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based route protection
* Protected dashboards per user role
* Token refresh handling

---

## 🌐 Internationalization (Planned)

* English
* French
* Arabic

---

## 🔔 Notifications (Planned)

* Appointment status updates
* Consultation reminders
* Online session links

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm or yarn
* Running backend API (.NET)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5155/api
```

### Run the Project

```bash
npm run dev
```

---

## 🧪 Scripts

```bash
npm run dev       # Start development server
npm run build     # Build production version
npm run start     # Start production server
npm run lint      # Run linting
```

---

## 🛠️ Future Improvements

* Payment integration
* Mobile application
* AI-assisted scheduling
* Medical file uploads
* In-app chat system
* Analytics dashboard

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contribution

Contributions are welcome!
Feel free to open issues or submit pull requests.

---

## 📬 Contact

For questions or collaboration, feel free to reach out.
