# PROJECT_PROGRESS.md — Apex Institute School Management Portal

> **Last Updated:** 2026-09-25
> **Status:** Core implementation complete — both servers running, database seeded, UI fully functional

---

## Summary

Full-stack School Management Portal for Apex Institute.
- **Backend:** Node.js + Express + TypeScript + native `node:sqlite` — port **5000**
- **Frontend:** React 19 + TypeScript + Vite + Vanilla CSS — port **5173**

---

## Completed

### Backend
- [x] Database schema (9 tables, 16 indexes): users, students, employees, courses, schedules, enrollments, grades, sessions, audit_logs
- [x] SQLite provider (node:sqlite, WAL mode, FK enforcement)
- [x] 10 repositories (user, student, employee, course, schedule, enrollment, grade, session, audit, base)
- [x] 8 services (auth, student, employee, course, schedule, enrollment, grade, audit)
- [x] 9 controllers
- [x] 11 route files mounted at /api
- [x] Middleware: JWT auth, RBAC, error handler, rate limiter
- [x] migrate.ts + seed.ts scripts (28 users, 22 emp, 6 students, 8 courses, 9 schedules, 8 enrollments, 8 grades, 179 sessions, 576 audit logs)
- [x] server.ts with health endpoint

### Frontend
- [x] Vite + React 19 + TypeScript project config
- [x] index.html with Inter/JetBrains Mono fonts + SEO meta
- [x] Complete Vanilla CSS design system (index.css, 1780+ lines)
- [x] main.tsx entry point
- [x] App.tsx main shell (loading → auth → role dashboard)
- [x] LoginPage.tsx (supports username/email/ID login, demo presets in DEMO mode)
- [x] RegisterPage.tsx (profile claiming via ID + DOB verification)
- [x] AuthContext, NotificationContext (toasts auto-dismiss)
- [x] api.ts (full typed API client, JWT injection, beacon logout)
- [x] StudentDashboard (profile, courses, schedules, grades + GWA)
- [x] EmployeeDashboard (profile, schedules, course catalog)
- [x] HrDashboard + EmployeeManagement (full CRUD)
- [x] RegistrarDashboard + Student/Course/Schedule/Enrollment/Grade management
- [x] AdminDashboard + UserManagement + AuditLogViewer
- [x] Common: Navbar, Sidebar, Modal, ConfirmDialog, Toast, ValidatedInput, StatusBadge

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Qwerty061902 |
| Registrar | registrar | RegistrarPassword123! |
| HR | hr_manager | HrPassword123! |
| Faculty | prof.smith | FacultyPassword123! |
| Student | john.doe | StudentPassword123! |
| All employees | firstname.lastname | Apex2026! |

**Unclaimed student:** STU-2024-0006 / Sophia Taylor / DOB: 1999-11-08

---

## Running the Project

```powershell
# Option A: use the batch launcher
start-dev.bat

# Option B: manual
cd backend; npm run dev     # port 5000
cd frontend; npm run dev    # port 5173

# Reset database
cd backend; npx tsx scripts/seed.ts
```

---

## Remaining / Future Work

- [ ] Mobile hamburger sidebar menu (<640px)
- [ ] Session expiry auto-cleanup cron
- [x] Demo mode auto-seed on startup & single-source-of-truth backend config (controlled via backend/.env APP_MODE=demo|normal)
- [ ] Grade PDF export

