# Clinic Management System — Agent Guide

A practical guide for AI agents working on this repository. Read this before making changes.

---

## 1. What this project is

A clinic/hospital management web app (CRUD + business workflow) built as a monorepo with a
**Laravel 10 REST API backend** and a **React (Vite) SPA frontend**. It tracks patients, doctors,
departments, appointments, medical records, prescriptions, medicines (inventory), and payments,
with role-based access for **Admin**, **Doctor**, and **Receptionist**.

Development environment is Windows + **Laragon** + **MySQL** (managed via HeidiSQL).

---

## 2. Tech stack (as actually used)

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Backend   | PHP ^8.1, Laravel ^10.10, Laravel Sanctum ^3.3          |
| Database  | MySQL (`clinic_management`, utf8mb4_unicode_ci)         |
| Frontend  | React 19, Vite 8, Tailwind CSS 4, react-router-dom 7    |
| Frontend libs | axios, recharts (charts), lucide-react (icons)     |
| Tooling   | Composer, npm, PHPUnit (backend), ESLint (frontend)     |

There are NO TypeScript, Redux, or zod usages in `src` despite them being present in
`node_modules` (zod/redux are transitive deps of other packages — do not use them).

---

## 3. Architecture

```
React SPA (Vite, port 5173)
      │  axios, Bearer token, JSON
      ▼
Laravel API (http://127.0.0.1:8000/api)  ← Sanctum auth + RoleMiddleware
      │  Eloquent ORM
      ▼
MySQL database `clinic_management`
```

- Frontend talks to backend at **`http://127.0.0.1:8000/api`** (hardcoded in
  `frontend/src/services/api.js` and `frontend/src/context/AuthContext.jsx`).
- Auth is token-based: `POST /api/login` returns `access_token`; the token is stored in
  `localStorage` key `token` and attached as `Authorization: Bearer <token>` via an axios
  interceptor.
- 401 responses clear the token and redirect to `/login`; 403 dispatches an
  `api-forbidden` window event.

### Directory layout

```
clinic-management-system/
├── backend/            # Laravel 10 API
│   ├── app/Http/Controllers/Api/   # AuthController, DashboardController, DepartmentController,
│   │                               # DoctorController, PatientController, MedicalRecordController,
│   │                               # MedicineController, PrescriptionController, PaymentController,
│   │                               # ReportController
│   ├── app/Http/Controllers/AppointmentController.php   # (top-level, imported specially in routes)
│   ├── app/Http/Middleware/RoleMiddleware.php           # registered as `role`
│   ├── app/Models/          # User, Role, Department, Doctor, Patient, Appointment,
│   │                        # MedicalRecord, Medicine, Prescription, PrescriptionItem, Payment
│   ├── database/migrations/ # 12 domain tables + 1 alter (doctor status enum)
│   ├── database/seeders/DatabaseSeeder.php   # roles + 3 users + 1 patient
│   └── routes/api.php       # ALL API routes
├── frontend/           # React SPA
│   └── src/
│       ├── App.jsx                 # route table
│       ├── components/             # ProtectedRoute, AppointmentForm/Modal/Table, PrescriptionFormModal
│       │   └── common/layout/      # Navbar.jsx, Sidebar.jsx, Footer.jsx
│       ├── context/                # AuthContext.jsx, ThemeContext.jsx
│       ├── layouts/                # AdminLayout, DoctorLayout, RoleRoute
│       ├── pages/                  # one file per feature (see below)
│       ├── services/               # axios wrappers per resource
│       └── utils/permissions.js    # role/permission helpers
├── plan.txt             # original 10-day dev plan (historical; does not match final code exactly)
├── Structure.txt        # planned file tree (partially outdated)
├── Database.txt         # full SQL schema reference
└── Architecture         # ASCII architecture + role permission overview
```

---

## 4. Roles & permissions

Roles are stored as `roles.name` strings: **Admin**, **Doctor**, **Receptionist**.
Role checking is **case-insensitive** (`RoleMiddleware` lowercases both sides).

### Backend (enforced in `routes/api.php` via `role:` middleware)

| Resource | view (index/show) | write | delete |
|---|---|---|---|
| departments | Admin, Receptionist | Admin | Admin |
| doctors | Admin, Doctor, Receptionist | Admin | Admin |
| patients | Admin, Doctor, Receptionist | Admin, Receptionist | Admin |
| appointments | Admin, Doctor, Receptionist | Admin, Receptionist | Admin |
| medical-records | Admin, Doctor | Admin, Doctor | Admin |
| prescriptions | Admin, Doctor | Admin, Doctor | Admin |
| medicines | Admin, Doctor, Receptionist | Admin | Admin |
| payments | Admin, Receptionist | Admin, Receptionist | Admin |
| reports | — | — | Admin only |

Dashboard + `/me`, `/profile`, `/password`, `/logout` are available to all three roles.

### Frontend (enforced in `src/utils/permissions.js` + route guards in `App.jsx`)

- `ROLES`, `routeRoles`, `actions`, `can(user, resource, action)`, `canVisit(user, path)`.
- Route groups in `App.jsx`:
  - All roles: `/dashboard`, `/appointments`, `/doctors`, `/patients`, `/medicines`
    (+ alias `/inventory`), `/profile`, `/settings`, `/support`
  - Admin + Doctor: `/medical-records`, `/prescriptions`
  - Admin + Receptionist: `/departments`, `/payments` (+ alias `/billing`)
  - Admin only: `/reports`, `/users`
  - `/403` → `Unauthorized` page
- Sidebar menu visibility is driven by role too (see `common/layout/Sidebar.jsx`).

---

## 5. Database schema (summary)

Full SQL: `Database.txt`. Tables:

1. **roles** — id, name (unique), description
2. **users** — role_id FK→roles, name, email (unique), password, phone, status
   (active/inactive)
3. **departments** — name (unique), description, status
4. **doctors** — user_id (unique FK→users, cascade), department_id FK→departments,
   specialization, license_number (unique), gender, date_of_birth, address, **status
   (active/inactive/on_leave — extended by migration `2026_08_12_014437`)**
5. **patients** — patient_code (unique, e.g. `P1001`), first_name, last_name, gender,
   date_of_birth, blood_group, phone, email, address, emergency_contact, emergency_phone, status
6. **appointments** — patient_id, doctor_id, appointment_date, appointment_time, reason,
   status (pending/confirmed/completed/cancelled), notes
7. **medical_records** — patient_id, doctor_id, appointment_id (unique), symptoms, diagnosis,
   treatment, notes
8. **medicines** — name, category, description, quantity (unsigned), unit, price
   (DECIMAL 10,2), expiry_date, status
9. **prescriptions** — patient_id, doctor_id, medical_record_id, prescription_date, notes
10. **prescription_items** — prescription_id (cascade), medicine_id, quantity, dosage,
    frequency, duration, instruction
11. **payments** — patient_id, appointment_id, amount, payment_method (cash/aba/card),
    payment_status (pending/paid/cancelled), transaction_code (unique), payment_date, notes

Key relationships (Eloquent):
- User 1—1 Doctor; User N—1 Role
- Department 1—N Doctor; Doctor 1—N Appointment / MedicalRecord / Prescription
- Patient 1—N Appointment / MedicalRecord / Prescription / Payment
- Appointment 1—1 MedicalRecord; 1—N Payment
- MedicalRecord 1—N Prescription; Prescription 1—N PrescriptionItem N—1 Medicine

`DatabaseSeeder` creates the 3 roles and these login accounts (password = `password`):
- `admin@clinic.com`
- `doctor@clinic.com`
- `receptionist@clinic.com`

---

## 6. API reference (`backend/routes/api.php`)

All under `/api` prefix. Public: `POST /api/login`.

Authenticated (`auth:sanctum`):
- `GET /api/me`, `PUT /api/profile`, `PUT /api/password`, `POST /api/logout`
- `GET /api/dashboard`, `/api/dashboard/weekly`, `/api/dashboard/daily-this-month`,
  `/api/dashboard/monthly`
- RESTful: `departments`, `doctors`, `patients`, `appointments`, `medical-records`,
  `prescriptions`, `medicines`, `payments` (per-resource role rules above)

Admin-only:
- `GET /api/reports/patients`, `/api/reports/doctors`, `/api/reports/appointments`,
  `/api/reports/payments`, `/api/reports/medicines`

Notes / gotchas:
- **`AppointmentController` lives at `App\Http\Controllers\AppointmentController`**
  (top-level), while all other controllers are under `App\Http\Controllers\Api\`. Keep imports
  in `routes/api.php` consistent with this.
- Response shapes are hand-rolled (not API Resources). Login/me return
  `{ user: { id, name, email, phone, role } }` and login also returns `access_token`.
  List endpoints generally return paginated/plain arrays — inspect the controller before
  assuming a shape.
- Only `StorePatientRequest` exists; other controllers validate inline with
  `$request->validate(...)`.

---

## 7. Frontend structure

### Pages (`src/pages/`)
`Dashboard`, `Appointments`, `Doctor`, `Patients`, `MedicalRecord`, `Prescription`,
`Department`, `Medicine`, `Payment`, `Reports`, `User`, `Profile`, `Settings`, `Support`,
`Unauthorized`, plus `Auth/Login` and `Auth/Register`.

Aliases: `/inventory` renders `Medicine`; `/billing` renders `Payment`.

### Services (`src/services/`)
`api.js` (shared axios instance) + `appointmentService`, `dashboardService`,
`doctorService`, `medicalRecordService`, `medicineService`, `patientService`,
`paymentService`, `prescriptionService`, `reportService`. New API calls should go through
`api.js` (or a resource service importing it) so auth headers/401 handling apply.

### State
- `AuthContext` provides `{ user, token, login, logout, loading, updateProfile,
  changePassword }`. `useAuth()` hook reads it.
- `ThemeContext` handles dark/light mode (Tailwind `dark:` classes).
- No Redux / react-query — keep using context + local state.

### Styling
Tailwind CSS v4 (utility classes in JSX). Support dark mode via `dark:` variants. Reuse
existing components (modal/table/form patterns in `components/`) instead of inventing new
ones.

---

## 8. Common commands

### Backend (Laravel 10, served by Laragon at 127.0.0.1:8000)
```bash
cd backend
composer install
copy .env.example .env          # set DB_DATABASE=clinic_management, DB_USERNAME=root, DB_PASSWORD=
php artisan key:generate
php artisan migrate --seed      # build schema + seed roles/users/patient
php artisan serve               # or run via Laragon
```

### Frontend (Vite dev server at 5173)
```bash
cd frontend
npm install
npm run dev                     # starts dev server
npm run build                   # production build
npm run lint                    # ESLint
```

---

## 9. Conventions & rules for agents

1. **Follow existing patterns.** Read a neighboring controller/page/service before editing;
   mirror its style (inline validation, manual response arrays, axios service wrappers,
   Tailwind classes).
2. **No TypeScript, no API Resources, no Spatie packages.** Stick to Eloquent + vanilla
   Laravel; React + axios + context.
3. **Auth is Sanctum + Bearer.** Never weaken `auth:sanctum` / `role:` middleware when
   touching routes. Keep the `role` route middleware registered in `Http/Kernel.php`.
4. **Frontend route guards mirror backend roles.** If you change backend permissions, update
   `src/utils/permissions.js` and `App.jsx` route groups to match.
5. **Don't commit secrets.** `.env` files and `node_modules`/`vendor` are git-ignored; keep it
   that way. Never write real credentials into code or docs.
6. **Don't add code comments unless asked.** Keep the codebase's current minimal-comment style.
7. **Verify work.** Backend: `php artisan test` (PHPUnit) or manual Postman-style curl;
   frontend: `npm run build` / `npm run lint`. There are currently no dedicated test suites
   for the app domain beyond Laravel's `ExampleTest` stubs.
8. **Docs files `plan.txt`/`Structure.txt` are historical.** Trust the code, not the docs,
   when they disagree (e.g., actual controllers live under `Api\`, frontend has flat page
   files, doctor status includes `on_leave`).

---

## 10. Known gaps / things to be careful with

- **Register page exists but no backend register endpoint** — `Register.jsx` has no working
  API to call.
- **`/users` page exists but backend has no users/roles CRUD API** — User management is
  frontend-only right now.
- `AuthContext.jsx` sets `axios.defaults.baseURL` while `services/api.js` uses its own
  instance with the same base URL — keep both pointing at `http://127.0.0.1:8000/api`.
- Doctor status enum was extended to include `on_leave` via a raw `DB::statement` migration;
  any revert must clean `on_leave` rows first.
- `Doctor` profile data is linked to `users` via `user_id` (1:1); creating a doctor also
  needs a `User` row. Check `DoctorController` before assuming how doctor creation works.
