# Educa React Project System Summary

## 1. Project Overview

This project is a full-stack school management system built with:

- React + Vite on the frontend
- Express + Prisma on the backend
- MySQL / MariaDB as the database
- JWT-based authentication

The codebase is split into `client/` and `server/` so UI logic and API logic stay easy to understand.

Primary root files:

- `package.json`
- `README.md`
- `client/package.json`
- `server/package.json`

## 2. Current Folder Architecture

### Root

Main workspace:

- `client/` - frontend app
- `server/` - backend API
- `docs/` - project documentation
- `README.md` - base project notes
- `package.json` - root helper scripts

### Frontend

Frontend source:

- `client/src/main.jsx` - React entry point
- `client/src/app/App.jsx` - startup splash + shell handoff
- `client/src/app/router.jsx` - route map
- `client/src/providers/AppProviders.jsx` - React Query + Auth + Toaster
- `client/src/layouts/AuthLayout.jsx` - auth pages shell
- `client/src/layouts/DashboardLayout.jsx` - protected app shell, sidebar, topbar, modals
- `client/src/components/navigation/` - sidebar and topbar shell components
- `client/src/components/ui/` - shared controls and modal/table helpers
- `client/src/components/ux/` - splash and page transition components
- `client/src/features/` - per-feature API and feature helpers
- `client/src/pages/` - route pages
- `client/src/lib/http.js` - Axios instance
- `client/src/styles/index.css` - global design system and component styling

### Backend

Backend source:

- `server/src/server.js` - server bootstrap
- `server/src/app.js` - Express app configuration
- `server/src/config/env.js` - environment parsing
- `server/src/config/prisma.js` - Prisma client export
- `server/src/routes/index.js` - API route registration
- `server/src/middlewares/requireAuth.js` - JWT auth guard
- `server/src/middlewares/errorHandler.js` - error formatting
- `server/src/middlewares/notFound.js` - 404 handling
- `server/src/modules/` - feature-based backend modules
- `server/prisma/schema.prisma` - full database schema
- `server/prisma/saved.sql` - XAMPP import snapshot / starter data

## 3. How The Application Boots

### Frontend Boot Flow

1. `client/src/main.jsx`
2. `client/src/providers/AppProviders.jsx`
3. `client/src/app/App.jsx`
4. `client/src/app/router.jsx`
5. `client/src/layouts/DashboardLayout.jsx` or `client/src/layouts/AuthLayout.jsx`

Frontend boot details:

- `client/src/main.jsx` mounts the app and router.
- `client/src/providers/AppProviders.jsx` sets up React Query, auth context, and toast notifications.
- `client/src/app/App.jsx` shows the startup splash and transitions into the app shell.
- `client/src/app/router.jsx` decides whether to render login or dashboard routes.

### Backend Boot Flow

1. `server/src/server.js`
2. `server/src/app.js`
3. `server/src/routes/index.js`
4. feature module routers under `server/src/modules/*/*.routes.js`

Backend boot details:

- `server/src/server.js` starts the HTTP server.
- `server/src/app.js` wires CORS, Helmet, rate limiting, JSON parsing, cookies, logging, and API routes.
- `server/src/routes/index.js` mounts feature routers under `/api`.

## 4. Frontend Route Map

Defined in `client/src/app/router.jsx`.

### Public Route

- `GET /login`
  - Page: `client/src/pages/auth/LoginPage.jsx`
  - Layout: `client/src/layouts/AuthLayout.jsx`

### Protected Dashboard Routes

- `/dashboard`
  - Page: `client/src/pages/dashboard/DashboardPage.jsx`
  - Layout: `client/src/layouts/DashboardLayout.jsx`

- `/dashboard/students`
  - Page: `client/src/pages/students/StudentsPage.jsx`

- `/dashboard/teachers`
  - Page: `client/src/pages/teachers/TeachersPage.jsx`

- `/dashboard/academics`
  - Page: `client/src/pages/academics/AcademicsPage.jsx`

- `/dashboard/attendance`
  - Page: `client/src/pages/attendance/AttendancePage.jsx`

- `/dashboard/assessments`
  - Page: `client/src/pages/assessments/AssessmentsPage.jsx`

- `/dashboard/calendar`
  - Page: `client/src/pages/calendar/CalendarPage.jsx`

- `/dashboard/communication`
  - Page: `client/src/pages/communication/CommunicationPage.jsx`

- `/dashboard/reports`
  - Page: `client/src/pages/reports/ReportsPage.jsx`

## 5. Frontend Feature API Files

Each feature uses a small API file under `client/src/features/`.

- Auth: `client/src/features/auth/api.js`
- Students: `client/src/features/students/api.js`
- Teachers: `client/src/features/teachers/api.js`
- Academics: `client/src/features/academics/api.js`
- Attendance: `client/src/features/attendance/api.js`
- Assessments: `client/src/features/assessments/api.js`
- Dashboard: `client/src/features/dashboard/api.js`
- Calendar: `client/src/features/calendar/api.js`
- Communication: `client/src/features/communication/api.js`
- Notifications bridge: `client/src/features/notifications/api.js`
- Notifications read-state storage: `client/src/features/notifications/storage.js`
- Reports: `client/src/features/reports/api.js`
- Global search: `client/src/features/search/api.js`

Shared HTTP client:

- `client/src/lib/http.js`

## 6. Dashboard Shell / UI Infrastructure

Main shell files:

- Sidebar config: `client/src/components/navigation/dashboardShellConfig.js`
- Sidebar component: `client/src/components/navigation/DashboardSidebar.jsx`
- Topbar component: `client/src/components/navigation/DashboardTopbar.jsx`
- Layout coordinator: `client/src/layouts/DashboardLayout.jsx`
- Global styling: `client/src/styles/index.css`

Topbar responsibilities:

- sidebar collapse / expand
- live global search
- live messages panel
- live alerts panel
- user menu
- profile modal
- settings modal

## 7. Authentication Flow

### Frontend

- Context: `client/src/features/auth/AuthContext.js`
- Provider: `client/src/features/auth/AuthProvider.jsx`
- Hook: `client/src/features/auth/useAuth.js`
- Guards: `client/src/features/auth/AuthGuards.jsx`

Frontend auth behavior:

- login page submits to backend auth API
- access token is stored in localStorage or sessionStorage
- Axios default `Authorization` header is updated
- `/auth/me` is used to restore the current user session

### Backend

- Routes: `server/src/modules/auth/auth.routes.js`
- Controller: `server/src/modules/auth/auth.controller.js`
- Schema: `server/src/modules/auth/auth.schema.js`
- Service: `server/src/modules/auth/auth.service.js`
- Auth middleware: `server/src/middlewares/requireAuth.js`

## 8. Backend API Endpoint Map

All modules are registered in `server/src/routes/index.js` and exposed under `/api`.

### Health

Base route:

- `/api/health`

Endpoints:

- `GET /api/health`
  - Purpose: health check
  - Files:
    - route: `server/src/modules/health/health.routes.js`
    - controller: `server/src/modules/health/health.controller.js`

### Auth

Base route:

- `/api/auth`

Endpoints:

- `POST /api/auth/login`
  - Purpose: sign in and receive access token
  - Files:
    - route: `server/src/modules/auth/auth.routes.js`
    - controller: `server/src/modules/auth/auth.controller.js`
    - schema: `server/src/modules/auth/auth.schema.js`
    - service: `server/src/modules/auth/auth.service.js`

- `GET /api/auth/me`
  - Purpose: resolve current user session
  - Files:
    - route: `server/src/modules/auth/auth.routes.js`
    - controller: `server/src/modules/auth/auth.controller.js`
    - service: `server/src/modules/auth/auth.service.js`
    - middleware: `server/src/middlewares/requireAuth.js`

### Students

Base route:

- `/api/students`

Endpoints:

- `GET /api/students`
  - Purpose: list student records
- `GET /api/students/meta`
  - Purpose: load student module meta data
- `GET /api/students/:studentId`
  - Purpose: load a single student profile
- `POST /api/students`
  - Purpose: create a student record
- `PATCH /api/students/:studentId`
  - Purpose: update a student record
- `PATCH /api/students/:studentId/archive`
  - Purpose: archive a student record

Files:

- route: `server/src/modules/students/students.routes.js`
- controller: `server/src/modules/students/students.controller.js`
- schema: `server/src/modules/students/students.schema.js`
- service: `server/src/modules/students/students.service.js`

### Teachers

Base route:

- `/api/teachers`

Endpoints:

- `GET /api/teachers`
- `GET /api/teachers/meta`
- `GET /api/teachers/:teacherId`
- `POST /api/teachers`
- `PATCH /api/teachers/:teacherId`
- `PATCH /api/teachers/:teacherId/archive`

Files:

- route: `server/src/modules/teachers/teachers.routes.js`
- controller: `server/src/modules/teachers/teachers.controller.js`
- schema: `server/src/modules/teachers/teachers.schema.js`
- service: `server/src/modules/teachers/teachers.service.js`

### Academics

Base route:

- `/api/academics`

Endpoints:

- `GET /api/academics/overview`
  - Purpose: module overview
- `GET /api/academics/meta`
  - Purpose: classes, years, subjects, assignment meta
- `POST /api/academics/subjects`
  - Purpose: create subject
- `POST /api/academics/class-mappings`
  - Purpose: map subject to class
- `POST /api/academics/assessments`
  - Purpose: create academic assessment planning record

Files:

- route: `server/src/modules/academics/academics.routes.js`
- controller: `server/src/modules/academics/academics.controller.js`
- schema: `server/src/modules/academics/academics.schema.js`
- service: `server/src/modules/academics/academics.service.js`

### Assessments

Base route:

- `/api/assessments`

Endpoints:

- `GET /api/assessments`
- `GET /api/assessments/meta`
- `GET /api/assessments/:assessmentId`
- `POST /api/assessments`
- `PATCH /api/assessments/:assessmentId/status`
- `POST /api/assessments/:assessmentId/grades`

Files:

- route: `server/src/modules/assessments/assessments.routes.js`
- controller: `server/src/modules/assessments/assessments.controller.js`
- schema: `server/src/modules/assessments/assessments.schema.js`
- service: `server/src/modules/assessments/assessments.service.js`

### Attendance

Base route:

- `/api/attendance`

Endpoints:

- `GET /api/attendance/meta`
  - Purpose: attendance filters and select options
- `GET /api/attendance/board`
  - Purpose: monthly attendance board / register
- `POST /api/attendance/session`
  - Purpose: save or update a day attendance session

Files:

- route: `server/src/modules/attendance/attendance.routes.js`
- controller: `server/src/modules/attendance/attendance.controller.js`
- schema: `server/src/modules/attendance/attendance.schema.js`
- service: `server/src/modules/attendance/attendance.service.js`

### Dashboard

Base route:

- `/api/dashboard`

Endpoints:

- `GET /api/dashboard/overview`
  - Purpose: admin / teacher dashboard overview data

Files:

- route: `server/src/modules/dashboard/dashboard.routes.js`
- controller: `server/src/modules/dashboard/dashboard.controller.js`
- service: `server/src/modules/dashboard/dashboard.service.js`

### Communication

Base route:

- `/api/communication`

Endpoints:

- `GET /api/communication/overview`
- `POST /api/communication/announcements`
- `PATCH /api/communication/announcements/:announcementId`

Files:

- route: `server/src/modules/communication/communication.routes.js`
- controller: `server/src/modules/communication/communication.controller.js`
- schema: `server/src/modules/communication/communication.schema.js`
- service: `server/src/modules/communication/communication.service.js`

### Notifications Bridge

Base route:

- `/api/notifications`

Endpoints:

- `GET /api/notifications/overview`
  - Purpose: topbar messages + alerts feed

Files:

- route: `server/src/modules/notifications/notifications.routes.js`
- controller: `server/src/modules/notifications/notifications.controller.js`
- service: `server/src/modules/notifications/notifications.service.js`

### Reports

Base route:

- `/api/reports`

Endpoints:

- `GET /api/reports/meta`
- `GET /api/reports/overview`

Files:

- route: `server/src/modules/reports/reports.routes.js`
- controller: `server/src/modules/reports/reports.controller.js`
- schema: `server/src/modules/reports/reports.schema.js`
- service: `server/src/modules/reports/reports.service.js`

### Calendar

Base route:

- `/api/calendar`

Endpoints:

- `GET /api/calendar/meta`
- `GET /api/calendar/events`

Files:

- route: `server/src/modules/calendar/calendar.routes.js`
- controller: `server/src/modules/calendar/calendar.controller.js`
- schema: `server/src/modules/calendar/calendar.schema.js`
- service: `server/src/modules/calendar/calendar.service.js`

### Search

Base route:

- `/api/search`

Endpoints:

- `GET /api/search/global`
  - Purpose: topbar live global search

Files:

- route: `server/src/modules/search/search.routes.js`
- controller: `server/src/modules/search/search.controller.js`
- schema: `server/src/modules/search/search.schema.js`
- service: `server/src/modules/search/search.service.js`

## 9. Database / Prisma Model Summary

Defined in `server/prisma/schema.prisma`.

### Enums

- `UserRole`
- `EnrollmentStatus`
- `AttendanceStatus`
- `AssessmentType`
- `AssessmentStatus`
- `AnnouncementAudience`
- `AnnouncementStatus`

### Core Models

- `User`
  - base account table
- `Student`
  - student profile linked to `User`
- `Teacher`
  - teacher profile linked to `User`
- `AcademicYear`
  - school year
- `Term`
  - term / semester inside academic year
- `SchoolClass`
  - class / stream
- `Subject`
  - subject catalog
- `ClassSubject`
  - subject mapped to class
- `TeacherSubject`
  - subject assigned to teacher, optionally by class
- `Enrollment`
  - student-to-class enrollment in academic year
- `AttendanceRecord`
  - daily attendance record
- `Assessment`
  - assignment / quiz / exam
- `Announcement`
  - communication notices
- `GradeEntry`
  - per-student marks for an assessment

## 10. Feature To Backend Mapping

### Student Management

- Page: `client/src/pages/students/StudentsPage.jsx`
- API client: `client/src/features/students/api.js`
- Backend: `server/src/modules/students/`

### Teacher Management

- Page: `client/src/pages/teachers/TeachersPage.jsx`
- API client: `client/src/features/teachers/api.js`
- Backend: `server/src/modules/teachers/`

### Academic Management

- Page: `client/src/pages/academics/AcademicsPage.jsx`
- API client: `client/src/features/academics/api.js`
- Backend: `server/src/modules/academics/`

### Attendance

- Page: `client/src/pages/attendance/AttendancePage.jsx`
- API client: `client/src/features/attendance/api.js`
- Backend: `server/src/modules/attendance/`

### Assessments / Gradebook

- Page: `client/src/pages/assessments/AssessmentsPage.jsx`
- API client: `client/src/features/assessments/api.js`
- Backend: `server/src/modules/assessments/`

### Dashboard

- Page: `client/src/pages/dashboard/DashboardPage.jsx`
- Admin view: `client/src/pages/dashboard/components/AdminDashboardView.jsx`
- Teacher view: `client/src/pages/dashboard/components/TeacherDashboardView.jsx`
- API client: `client/src/features/dashboard/api.js`
- Backend: `server/src/modules/dashboard/`

### Calendar

- Page: `client/src/pages/calendar/CalendarPage.jsx`
- API client: `client/src/features/calendar/api.js`
- Backend: `server/src/modules/calendar/`

### Communication

- Page: `client/src/pages/communication/CommunicationPage.jsx`
- API client: `client/src/features/communication/api.js`
- Backend: `server/src/modules/communication/`

### Reports

- Page: `client/src/pages/reports/ReportsPage.jsx`
- API client: `client/src/features/reports/api.js`
- Backend: `server/src/modules/reports/`

## 11. Search / Notifications / Topbar Bridge

Topbar shell files:

- `client/src/components/navigation/DashboardTopbar.jsx`
- `client/src/layouts/DashboardLayout.jsx`

Data sources used by topbar:

- notifications API: `client/src/features/notifications/api.js`
- notifications local read-state: `client/src/features/notifications/storage.js`
- global search API: `client/src/features/search/api.js`
- backend notifications: `server/src/modules/notifications/`
- backend search: `server/src/modules/search/`

## 12. Environment And Runtime Configuration

### Backend Env

Defined / consumed by:

- `server/src/config/env.js`
- `server/.env`

Current keys used:

- `PORT`
- `CLIENT_URL`
- `JWT_SECRET`
- `DATABASE_URL`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

### Frontend Env

Defined / consumed by:

- `client/.env`
- `client/src/lib/http.js`

Current key used:

- `VITE_API_URL`

## 13. Seed / Import Notes

Database bootstrap files:

- Prisma schema: `server/prisma/schema.prisma`
- SQL import snapshot: `server/prisma/saved.sql`

Use `saved.sql` when importing starter tables and data into XAMPP / phpMyAdmin.

## 14. Root Scripts

Defined in `package.json`.

- `npm run dev`
  - runs frontend and backend dev servers together
- `npm run dev:client`
  - starts Vite frontend
- `npm run dev:server`
  - starts Express backend
- `npm run build`
  - builds frontend
- `npm run lint`
  - lints frontend and backend
- `npm run prisma:generate`
  - generates Prisma client
- `npm run prisma:migrate`
  - runs Prisma dev migration
- `npm run prisma:studio`
  - opens Prisma Studio

## 15. Server Scripts

Defined in `server/package.json`.

- `npm run dev`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## 16. Client Scripts

Defined in `client/package.json`.

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## 17. Current State Of The Project

Implemented and live:

- authentication
- protected dashboard shell
- students module
- teachers module
- academics module
- attendance module
- assessments module
- calendar module
- communication module
- reports module
- dashboard analytics
- notifications bridge
- live topbar global search

Not yet implemented as full business modules:

- finance
- parent portal
- library
- transport
- health and safety
- inventory

## 18. Recommended Maintenance References

If you need to understand the code quickly, start here:

1. `client/src/app/router.jsx`
2. `client/src/layouts/DashboardLayout.jsx`
3. `server/src/routes/index.js`
4. `server/prisma/schema.prisma`
5. the module folder you want under `server/src/modules/`
6. the matching page and API file under `client/src/pages/` and `client/src/features/`
