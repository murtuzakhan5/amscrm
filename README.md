# AMS Crafters — Employee Management & CRM System

A full-stack, production-ready MERN (MongoDB, Express.js, React.js, Node.js) web application architected for **AMS Crafters**. Features enterprise-grade Role-Based Access Control (RBAC), a 9-stage Lead Pipeline with dual Table & Kanban views, Calendar integration with timezone conversion, Task workflows, Client & Project Tracking, Sales Pipeline with payment reconciliation, Automated Attendance logging, real-time Notifications via Socket.IO, and deep Analytics powered by MongoDB Aggregation Pipelines.

---

## 1. System Architecture & Tech Stack

```text
ams-crafters-crm/
├── client/                 # React 18 + Vite + Tailwind CSS + Zustand
│   ├── src/
│   │   ├── components/     # Layout, Common, Tables, Kanban, Calendar, Charts, Forms
│   │   ├── pages/          # Auth, Admin, Manager, and Employee pages
│   │   ├── routes/         # Protected routes & RoleGuard
│   │   ├── services/       # Axios client with HttpOnly Cookie & Auto-Refresh
│   │   └── store/          # Zustand state stores (auth, notifications, theme)
│   └── package.json
│
├── server/                 # Express.js REST API + Mongoose + Socket.IO
│   ├── src/
│   │   ├── config/         # DB connection, JWT secrets, Socket.IO, Env
│   │   ├── controllers/    # Business logic for all modules
│   │   ├── middleware/     # Auth, RBAC, Record isolation, Rate limiting, Error handling
│   │   ├── models/         # 17 normalized Mongoose schemas
│   │   ├── routes/         # Express API routers
│   │   ├── scripts/        # Seed Super Admin & complete Demo dataset
│   │   ├── services/       # Audit logger, Notifications, Nodemailer email simulator
│   │   └── tests/          # Vitest + Supertest integration test suite
│   └── package.json
│
├── .env.example            # Environment configuration template
├── package.json            # Root workspace scripts
└── README.md
```

### Technology Highlights
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, FullCalendar, Recharts, TanStack Table v8, React Hook Form + Zod, React Hot Toast.
- **Backend:** Node.js, Express.js, MongoDB + Mongoose, Bcrypt password hashing, JWT Access & Refresh Tokens stored in **secure HttpOnly cookies**, Helmet security headers, Express Rate Limiter, Morgan logger.
- **Database Resilience:** Supports direct MongoDB / MongoDB Atlas connections, with automatic graceful fallback to `mongodb-memory-server` for instant local development and zero-setup CI testing.
- **Brand Palette:**
  - Primary (AMS Navy): `#17365D`
  - Secondary (AMS Electric Blue): `#2563EB`
  - Neutral Background: `#F8FAFC` (with full Light/Dark mode)
  - Success: `#16A34A` | Warning: `#F59E0B` | Danger: `#DC2626`

---

## 2. Quickstart Installation Guide

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on Node `v24`)
- npm `v9+` or `v10+`

### Step 1: Install Dependencies
From the project root:
```bash
npm --prefix server install
npm --prefix client install
```

### Step 2: Environment Configuration
Copy `.env.example` into `server/.env`:
```bash
cp .env.example server/.env
```
*(By default, `USE_IN_MEMORY_DB=true` is enabled in `server/.env` so the application runs immediately without requiring a local MongoDB daemon installed).*

### Step 3: Seed Super Admin & Realistic Demo Data
Run the comprehensive seed script to populate users, leads across all 9 statuses, calendar meetings, deals, and attendance logs:
```bash
# Inside server directory:
node src/scripts/seedDemoData.js
```

### Step 4: Start Development Servers
Start both backend and frontend servers:

**Backend API Server (Port 5000):**
```bash
npm --prefix server run dev
```

**Frontend Client Application (Port 5173):**
```bash
npm --prefix client run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 3. Pre-Seeded Accounts & Test Credentials

The login screen includes **1-click quick-fill buttons** for each role for instant testing:

| Role | Email Address | Password | Permissions & Scope |
|---|---|---|---|
| **Super Admin** | `admin@amscrafters.com` | `AdminPassword123!` | Complete access to all 16 modules, full analytics, employee creation, reassignments, settings, audit logs. |
| **Manager** | `sarah.jenkins@amscrafters.com` | `Password123!` | Access to team members, team leads, team meetings, tasks, and team performance reports. |
| **Employee** | `ali.hassan@amscrafters.com` | `Password123!` | Strictly isolated to assigned leads, personal tasks, personal calendar, punch-in/out attendance, personal profile. |

---

## 4. Complete Module Overview

### 1. Authentication & Security
- **Email & Password Authentication:** Bcrypt hashing with 12 salt rounds.
- **HttpOnly Cookies:** Access token (15m expiry) and Refresh token (7d expiry) sent via secure cookies; tokens are never exposed in `localStorage`.
- **Refresh Token Rotation:** Refreshing a session generates a new refresh token and revokes the previous token in the `RefreshSession` collection to prevent replay attacks.
- **Password Reset Flow:** Cryptographic single-use token generation with 1-hour expiration; email dispatcher with development console fallback.
- **Rate Limiting:** IP-based protection on `/api/auth/login` (10 requests per 15 minutes).

### 2. Employee Management Module
- Sequential Employee ID generation (`AMS-EMP-0001`, `AMS-ADM-0001`).
- Department filter (`Executive`, `Sales`, `Custom Software Engineering`, `UI/UX Design`, `Operations & HR`).
- Manager assignment hierarchy.
- Account Activation/Deactivation toggles linked directly to `User.isActive`.
- Detailed profile view displaying assigned leads, completed tasks, meetings, and attendance history.

### 3. CRM Lead Management (Core Module)
- **9 Pipeline Stages:**
  1. `New Lead`
  2. `Assigned`
  3. `Contacted`
  4. `Follow-up Required`
  5. `Meeting Scheduled`
  6. `Proposal Sent`
  7. `Negotiation`
  8. `Won` (Converts to client)
  9. `Lost` (Requires mandatory lost reason)
- **Dual Views:**
  - **Table View:** Searchable, sortable TanStack Table with CSV export.
  - **Kanban Board:** Visual pipeline board organized across all 9 stages.
- **Lead Detail Page:** Complete activity history timeline, follow-up scheduler, call logger, notes feed, reassign modal, and convert to client modal.

### 4. Meeting Management & Calendar
- **FullCalendar Integration:** Month, Week, and Day calendar views.
- **Timezone Management:** Stored internally in UTC; displayed in configured company timezone (default: `Asia/Karachi`).
- **Meeting Types:** Client Call, Online Meeting (Google Meet/Zoom), Physical Meeting, Internal Team Sync, Follow-up Meeting.
- **Outcome & Next Action:** Post-meeting outcome recorder linked directly to lead timeline.

### 5. Task Management
- Dual Table & Kanban views (`To Do`, `In Progress`, `In Review`, `Completed`).
- Priority levels (`Low`, `Medium`, `High`, `Urgent`).
- Threaded task comments and completion dates.

### 6. Client & Project Management
- Automatic conversion from Won leads preserving all prior lead history.
- Project tracking with progress percentages (`0-100%`), budgets, milestones, and deliverable checklists.

### 7. Sales Pipeline & Deal Reconciliation
- Real-time pipeline calculation tracking expected deal value vs **actual collected revenue**.
- Probability forecasting and closing dates.

### 8. Employee Attendance System
- Employee punch in & punch out with live session timers.
- Configurable working hours (Default: `09:00` start with `15` minute grace period).
- Automatic late minute calculations (`+35 min late`) and status assignments (`Present`, `Late`, `Half Day`).
- Monthly attendance history and administrative overview.

### 9. Reports, Analytics & Auditing
- Real MongoDB Aggregation Pipelines:
  - Lead conversion rate (`won / total * 100`)
  - Monthly lead growth trend (Recharts area graph)
  - Lead distribution by status & source
  - Employee sales performance bar charts
- System-wide security audit logs tracking entity changes, user IDs, and client IP addresses.

---

## 5. Automated Testing Suite

Backend integration tests using **Vitest** and **Supertest** verify:
- Correct and incorrect logins
- Role-based route protection
- Employee record isolation
- Lead assignment and status updates
- Dashboard statistics calculations
- Attendance check-in logic

Run the test suite:
```bash
# Inside server directory:
node node_modules/vitest/vitest.mjs run
```

---

## 6. Production Build Verification

To compile the React frontend for production:
```bash
# Inside client directory:
node node_modules/vite/bin/vite.js build
```
Build outputs are placed in `client/dist/`.

---

## 7. License

Built for **AMS Crafters**. All rights reserved.
