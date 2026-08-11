# Agent Guide — Clinic Management System

This file is the first stop for an AI agent working on this repo. It describes the **real, current state** of the code. If a section here disagrees with the plan/structure docs (`plan.txt`, `Structure.txt`), trust this file and the actual code — those docs describe the original plan and are partly outdated.

## Project Overview

A clinic management system:

- **Backend**: Laravel 10 REST API in `backend/`
- **Frontend**: React 19 + Vite SPA in `frontend/`
- **Auth**: Laravel Sanctum bearer tokens
- **Database**: MySQL (via Laravel migrations), run under Laragon
- **Domain areas**: auth, roles, departments, doctors, patients, appointments, medical records, medicines, prescriptions, payments, dashboard, reports

> ⚠ Both `Structures.txt` (a planned folder layout) and `plan.txt` (a 10-day build plan) exist next to this file. They describe the **intended** design, not necessarily what was implemented. When making changes, read the real code.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | PHP / Laravel | `^8.1` / `^10.10` |
| API auth | laravel/sanctum | `^3.3` |
| Frontend | React | `^19` |
| Build tool | Vite | `^8` |
| Router | react-router-dom | `^7` |
| HTTP | axios | `^1` |
| Styling | Tailwind CSS (via `@tailwindcss/vite`) | `^4` |
| Icons | lucide-react | — |
| Charts | recharts | `^3` |

## High-Level Architecture

- Backend exposes JSON endpoints under `/api` (see `backend/routes/api.php`).
- Frontend calls `http://127.0.0.1:8000/api` directly (no Vite proxy; backend must allow CORS — Sanctum/CORS config paths apply).
- Login returns a Sanctum token, stored in `localStorage` under key `token`.
- Two axios setups exist (see "Gotchas"): the auth context uses the global `axios` defaults; the service modules use the shared `api` instance.
- Protected frontend routes are gated by `ProtectedRoute` + `AuthContext` with role checks.

## Directory Structure (actual)

```
clinic-management-system/
├── agent_guide.md              # this file
├── plan.txt / Structure.txt    # original plan docs (reference only)
├── backend/                    # Laravel 10 API
│   ├── routes/api.php
│   ├── app/Http/Controllers/
│   │   ├── Api/                # most controllers
│   │   └── AppointmentController.php   # NOTE: in root HTTP namespace
│   ├── app/Models/
│   ├── database/migrations/
│   ├── database/seeders/DatabaseSeeder.php
│   └── .env                    # DB=clinic_management
└── frontend/                   # React SPA
    ├── src/
    │   ├── main.jsx            # bootstrap (BrowserRouter + AuthProvider)
    │   ├── App.jsx             # all routes
    │   ├── index.css
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   └── common/layout/{Sidebar,Navbar,Footer}.jsx
    │   ├── pages/              # one file per page, flat (not nested folders)
    │   │   ├── Auth/{Login,Register}.jsx
    │   │   ├── Dashboard, Appointments, Doctor, Patients, Department,
    │   │   │   MedicalRecord, Prescription, Medicine, Payment, User, Reports .jsx
    │   ├── services/           # thin axios wrappers, one per domain
    │   └── layouts/            # AdminLayout, DoctorLayout, RoleRoute
    └── package.json
```

## Backend

### Routes (`backend/routes/api.php`)

Public:

- `POST /api/login`

Protected by `auth:sanctum`:

- `GET /api/me`, `POST /api/logout`
- `apiResource` for: `departments`, `doctors`, `patients`, `appointments`, `medical-records`, `prescriptions`, `medicines`, `payments`
- `GET /api/dashboard`
- `GET /api/reports/patients|doctors|appointments|payments|medicines`

### Controllers

| Controller | Location | Notes |
|---|---|---|
| `AuthController` | `Api/` | login, me, logout |
| `DashboardController` | `Api/` | `index()` stats + `monthly()` chart data |
| `ReportController` | `Api/` | patient/doctor/appointment/payment/medicine exports |
| `DepartmentController` | `Api/` | CRUD |
| `DoctorController` | `Api/` | CRUD + creates/updates a linked `users` row |
| `PatientController` | `Api/` | CRUD |
| `MedicalRecordController` | `Api/` | CRUD |
| `MedicineController` | `Api/` | CRUD, manual `Validator` |
| `PrescriptionController` | `Api/` | CRUD, nested items |
| `PaymentController` | `Api/` | CRUD with filters |
| `AppointmentController` | **root `Http/Controllers`** | CRUD, uses route-model binding |

Notable: `AppointmentController` is **not** in the `Api` namespace. `routes/api.php` imports it as `use App\Http\Controllers\AppointmentController;`. Keep that import if you touch the routes.

### Domain Notes

**Auth**
- `login()` validates `email` + `password`, checks `status === 'active'` (returns 403 `{ message: "Your account is currently inactive." }` otherwise).
- Returns `{ message, access_token, token_type: "Bearer", user: { id, name, email, role } }`.
- `me()` returns `{ user: { id, name, email, role } }`.
- `logout()` deletes the current access token.

**Roles** (seeded in `DatabaseSeeder`)
- `Admin`, `Doctor`, `Receptionist`.
- Seeded users (password `password` for all): `admin@clinic.com`, `doctor@clinic.com`, `receptionist@clinic.com`.
- One seeded patient: `P1001` John Doe.

**Doctors**
- `store()` creates a `users` row (`role_id = 2`, default password `doctor7777`, name/email/phone/status) and a `doctors` row in one DB transaction.
- `update()` syncs the linked `User` too; `destroy()` deletes doctor + its user.
- Doctor fields (on the `doctors` table): `user_id, department_id, specialization, license_number, gender, date_of_birth, address, status`.
- Doctor index searches through the related `user` (name/email/phone), eager loads `user` + `department`, paginated 10.

**Patients**
- Fields: `patient_code, first_name, last_name, gender, date_of_birth, blood_group, phone, email, address, emergency_contact, emergency_phone, status`.
- `patient_code` and `gender` are required on create/update.
- Search across `first_name, last_name, patient_code, phone, email`; paginated 10.
- Note: patients have **no `name` column** — combine `first_name` + `last_name` in the UI.

**Appointments**
- Eager loads `patient` + `doctor`.
- Search matches patient first/last name; optional `status` filter.
- Status values: `pending, confirmed, completed, cancelled`.
- `show/update/destroy` use route-model binding `Appointment $appointment`.
- Store validation failure → 422 `{ success: false, message: "Validation failed.", errors }`.

**Dashboards**
- `/api/dashboard` → `{ success, data: { total_patients, total_doctors, appointments_today, total_revenue } }`.
- `/api/dashboard/monthly` → `{ success, data: { patients, appointments, revenue } }` (per-month aggregates). Note: **no `monthly` route is registered** in `api.php` even though the controller method exists.

**Reports**
- Return flat collections (not paginated): `{ success, data: [...] }`.
- Patients/appointments/payments accept optional `from`/`to` query params.
- Payments report does **not** eager-load `patient`.

### Models & Relationships

- `User`: belongsTo `Role`, hasOne `Doctor`. Fillable: `role_id, name, email, password, phone, status`.
- `Role`: hasMany `User` (plain model; `name` only).
- `Department`: hasMany `Doctor`.
- `Doctor`: belongsTo `User`, `Department`; hasMany `Appointment`, `MedicalRecord`, `Prescription`.
- `Patient`: hasMany `Appointment`, `MedicalRecord`, `Prescription`, `Payment`.
- `Appointment`: belongsTo `Patient`, `Doctor`; hasOne `MedicalRecord`; hasMany `Payment`. Fillable also includes `notes`.
- `MedicalRecord`: belongsTo patient/doctor/appointment, hasMany Prescription (fillable: `patient_id, doctor_id, appointment_id, symptoms, diagnosis, treatment, notes`).
- `Medicine`: fillable `name, category, description, quantity, unit, price, expiry_date`; casts price `decimal:2`, expiry_date to date; hasMany `PrescriptionItem`.
- `Prescription`: belongsTo `Patient`, `Doctor`, `MedicalRecord`; hasMany `PrescriptionItem` (fillable: `patient_id, doctor_id, medical_record_id, prescription_date, notes`).
- `PrescriptionItem`: belongsTo `Prescription`, `Medicine`.
- `Payment`: belongsTo `Patient`, `Appointment`; fillable `patient_id, appointment_id, amount, payment_method, payment_status, payment_date`. **Field is `payment_status`, not `status`.**

## Frontend

### Routing (`src/App.jsx`)

- Public: `/login`, `/register`; `/` and unknown paths redirect to `/dashboard`.
- `DashboardShell` layout (Sidebar + Navbar + `<Outlet />`) wraps all protected pages.
- Protected pages & allowed roles:
  - `[Admin, Doctor, Receptionist]`: `/dashboard`, `/appointments`, `/doctors`, `/patients`, `/departments`, `/medical-records`, `/prescriptions`
  - `[Admin, Doctor]`: `/medicines`
  - `[Admin, Receptionist]`: `/payments`
- **`/reports` is NOT routed** — `src/pages/Reports.jsx` exists but is not imported in `App.jsx` and no Sidebar link points to it.

### Auth Flow (`src/context/AuthContext.jsx`)

- On load: if `localStorage.token` exists, set the Bearer header and call `GET /me`; on failure → auto logout.
- `login(email, password)` stores `access_token` in `localStorage`, sets the header, updates state.
- `logout()` clears storage + header.
- `user.role` is a **string** (e.g. `"Admin"`), compared against `allowedRoles` arrays.

### Services (`src/services/`)

Thin wrappers around the shared axios instance. One module per domain: `api.js`, `appointmentService.js`, `dashboardService.js`, `doctorService.js`, `medicalRecordService.js`, `medicineService.js`, `patientService.js`, `paymentService.js`, `prescriptionService.js`, `reportService.js`.

- `api.js` creates its own axios instance with `baseURL: http://127.0.0.1:8000/api` and a request interceptor that attaches `Bearer <token>` from `localStorage`.

## API Response Shapes

The backend is **not uniform**. Confirmed shapes:

| Endpoint | Shape |
|---|---|
| `POST /login` | `{ message, access_token, token_type, user: { id, name, email, role } }` |
| `GET /me`, `POST /logout` | top-level `{ user: {...} }` / `{ message }` |
| Most CRUD lists | `{ success, message, data: <paginator> }` → rows at `data.data`, paginator meta at `data.current_page`, `data.last_page`, etc. |
| `Appointment` list | `{ success, data: <paginator> }` (no `message`) |
| Reports `GET /api/reports/*` | `{ success, data: [ ... ] }` (plain array) |
| Dashboard | `{ success, data: { total_patients, ... } }` |
| Validation errors | 422 `{ success: false, message: "...", errors }` |

When adding frontend calls, read the controller first — do not assume a shape.

## Known Issues / Things To Watch Carefully

1. **Two axios paths**: `AuthContext.jsx` uses the global `axios` (defaults base URL + header). `src/services/api.js` is a separate instance with its own interceptor. Both must stay in sync around the Bearer token.
2. **`AppointmentController` namespace**: lives in `App\Http\Controllers` (root), not `Api`. Its imports and route registration reflect that.
3. **Reports page bugs**: `Reports.jsx` displays columns against fields that don't match the API (e.g. patients have `first_name/last_name` not `name`; doctors expose `user.name/user.phone` not `name/phone`; payments use `payment_status` not `status`). It also is **not routed**.
4. **Dashboard uses mock data**: `src/pages/Dashboard.jsx` renders hardcoded numbers/charts; it does not call `/api/dashboard`. `dashboardService.js` exists but is unused.
5. **Non-standard-line items**: `plan.txt`/`Structure.txt` describe planned layouts (nested `pages/patients/`, form components, etc.) that were not implemented as-is — real pages live flat in `src/pages/`.
6. **Encoding artifacts**: some files contain duplicated comments, Khmer-language comments, and odd characters (e.g. `AuthController` has a duplicated `namespace` line comment). Don't "fix" unrelated text unless you have to.
7. Doctor/User synchronization is critical — deleting a user without its doctor (or vice versa) will orphan rows.
8. `DashboardController@monthly` exists but has **no route**.
9. Frontend dev servers: backend at `http://127.0.0.1:8000`; there is **no Vite proxy**, so CORS is handled by Laravel config — check `backend/config/cors.php` if requests fail.

## Recommended Workflow For Future Changes

1. Read the relevant controller and model first.
2. Confirm the exact response shape (see table above).
3. Add/update the matching frontend service wrapper.
4. Wire the UI to the service; keep the existing simple functional-component style.
5. Respect role restrictions in `App.jsx` (`ProtectedRoute`).
6. Run `npm run lint` in `frontend/` (eslint is configured) after JS changes.

## Short Summary For Agents

Laravel 10 Sanctum API + React 19/Vite dashboard for a clinic. Entities: users, roles, departments, doctors, patients, appointments, medical records, medicines, prescriptions (+ items), payments, plus dashboard/report endpoints. Most work is CRUD screens, token auth, and keeping frontend service calls aligned with (non-uniform) controller response shapes. Beware the two axios setups, the root-namespace `AppointmentController`, unmatched Reports/Dashboard wiring, and the planning docs that don't match reality.