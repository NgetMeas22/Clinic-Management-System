# Clinic Management System — Agent Guide

A practical guide for AI agents working on this repository. Read this before making changes.

---

## 1. What this project is

A clinic/hospital management web app (CRUD + business workflow) built as a monorepo with a
**Laravel 10 REST API backend** and a **React (Vite) SPA frontend**. It tracks patients, doctors,
departments, appointments, medical records, prescriptions, medicines (inventory), and payments,
with role-based access for **Admin**, **Doctor**, and **Receptionist**. Brand: **NGM Clinic**.

The UI is bilingual **Khmer (default) / English** — routes, navigation, and labels are localized
(see §7 "i18n & locale").

Development environment is Windows + **Laragon** + **MySQL** (managed via HeidiSQL).

---

## 2. Tech stack (as actually used)

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Backend   | PHP ^8.1, Laravel ^10.10, Laravel Sanctum ^3.3          |
| Auth (social) | Laravel Socialite ^5.30 (Google OAuth, stateless)  |
| Integrations | Telegram Bot API (support messages via `Http` client) |
| Database  | MySQL (`clinic_management`, utf8mb4_unicode_ci)         |
| Frontend  | React 19, Vite 8, Tailwind CSS 4, react-router-dom 7    |
| Frontend libs | axios, recharts (charts), lucide-react (icons)      |
| Tooling   | Composer, npm, PHPUnit (backend), ESLint (frontend)     |

There are NO TypeScript, Redux, or zod usages in `src` despite them being present in
`node_modules` (zod/redux are transitive deps of other packages — do not use them).

---

## 3. Architecture

```
React SPA (Vite, port 5173)
      │  axios, Bearer token, JSON, Accept-Language header
      ▼
Laravel API (http://127.0.0.1:8000/api)  ← Sanctum auth + RoleMiddleware
      │  Eloquent ORM
      ▼
MySQL database `clinic_management`
```

- Frontend talks to backend at **`http://127.0.0.1:8000/api`**. This is centralized in
  `frontend/src/api/axios.js` (the shared axios instance, re-exported by
  `frontend/src/services/api.js`). `AuthContext.jsx` ALSO sets `axios.defaults.baseURL` to the
  same value — keep both in sync.
- Auth is token-based: `POST /api/login` returns `access_token`; the token is stored in
  `localStorage` key `token` and attached as `Authorization: Bearer <token>` by the axios
  request interceptor in `src/api/axios.js`.
- The request interceptor also sends `Accept-Language: km|en` (derived from the URL path).
- 401 responses clear the token and hard-redirect to `/login` (or `/en/login`); 403 dispatches
  an `api-forbidden` window event.

### Directory layout

```
clinic-management-system/
├── backend/            # Laravel 10 API
│   ├── app/Http/Controllers/Api/   # AuthController, DashboardController, DepartmentController,
│   │                               # DoctorController, PatientController, MedicalRecordController,
│   │                               # MedicineController, PrescriptionController, PaymentController,
│   │                               # ReportController, UserController
│   ├── app/Http/Controllers/Auth/GoogleController.php  # Google OAuth (Socialite, stateless)
│   ├── app/Http/Controllers/AppointmentController.php   # (top-level, imported specially in routes)
│   ├── app/Http/Controllers/SupportController.php       # (top-level; forwards support msgs to Telegram)
│   ├── app/Http/Middleware/RoleMiddleware.php           # registered as `role`
│   ├── app/Models/          # User, Role, Department, Doctor, Patient, Appointment,
│   │                        # MedicalRecord, Medicine (SoftDeletes), Prescription,
│   │                        # PrescriptionItem, Payment
│   ├── database/migrations/ # 11 domain tables + 5 alter migrations (see §5)
│   ├── database/seeders/DatabaseSeeder.php   # roles + 3 users + doctor + 15 depts + 8 meds
│   └── routes/api.php       # ALL API routes
├── frontend/           # React SPA
│   └── src/
│       ├── App.jsx                 # renders <AppRoutes /> (no routes defined here anymore)
│       ├── routes/AppRoutes.jsx    # route table + role-guarded route groups (see §7)
│       ├── api/axios.js            # single shared axios instance (baseURL, interceptors)
│       ├── components/             # ProtectedRoute, LanguageSwitcher, AppointmentModal/Form/Table,
│       │   │                       # PrescriptionFormModal
│       │   ├── common/layout/      # Navbar.jsx, Sidebar.jsx, Footer.jsx
│       │   └── ui/                 # shared UI kit (see §7): Button, Card, Badge, Modal, Table,
│       │                           # Field/TextInput/SelectInput/TextArea, SearchInput,
│       │                           # Pagination, EmptyState, PageHeader, statusTone (index.js barrel)
│       ├── context/                # AuthContext.jsx, ThemeContext.jsx, LocaleContext.jsx
│       ├── hooks/useUrlSearch.js   # syncs a search term with the `?search=` URL param
│       ├── i18n/translations.js    # km + en label strings (see §7)
│       ├── layouts/                # AdminLayout/DoctorLayout/RoleRoute — DEAD CODE, no longer imported
│       ├── pages/                  # one file per feature (see §7)
│       ├── services/               # axios wrappers per resource
│       └── utils/                  # permissions.js, localizedPath.js
├── plan.txt             # original 10-day dev plan (historical; does not match final code exactly)
├── Structure.txt        # planned file tree (partially outdated)
├── Database.txt         # full SQL schema reference (does NOT include the new alter migrations)
└── Architecture         # ASCII architecture + role permission overview
```

---

## 4. Roles & permissions

Roles are stored as `roles.name` strings: **Admin**, **Doctor**, **Receptionist**.
Role checking is **case-insensitive** (`RoleMiddleware` lowercases both sides).

### Backend (enforced in `routes/api.php` via `role:` middleware)

| Resource | view (index/show) | write | delete |
|---|---|---|---|
| departments | Admin, Doctor, Receptionist | Admin | Admin |
| doctors | Admin, Doctor, Receptionist | Admin | Admin |
| patients | Admin, Doctor, Receptionist | Admin, Receptionist | Admin |
| appointments | Admin, Doctor, Receptionist | store: Admin, Receptionist; update: Admin, Doctor, Receptionist | Admin |
| medical-records | Admin, Doctor | Admin, Doctor | Admin |
| prescriptions | Admin, Doctor | Admin, Doctor | Admin |
| medicines | Admin, Doctor, Receptionist | Admin | Admin |
| payments | Admin, Receptionist | Admin, Receptionist | Admin |
| users | Admin | Admin | Admin |
| reports | — | — | Admin only |

Dashboard + `/me`, `/profile`, `/password`, `/logout` are available to all three roles.

Doctor-specific scoping: in `AppointmentController`, `MedicalRecordController`, and
`PrescriptionController`, a Doctor user only sees rows where `doctor_id` = their linked Doctor
record. A Doctor whose `users` row has no `doctors` row gets an empty paginated list (the
`where('id', 0)` trick), not a 403.

### Frontend (enforced in `src/utils/permissions.js` + route groups in `src/routes/AppRoutes.jsx`)

- `ROLES`, `routeRoles`, `actions`, `can(user, resource, action)`, `canVisit(user, path)`.
- Route groups in `AppRoutes.jsx` (`APP_ROUTES` array):
  - All roles: `/dashboard`, `/appointments`, `/doctors`, `/patients`, `/medicines`,
    `/inventory`, `/profile`, `/settings`, `/support`
  - Admin + Doctor: `/medical-records`, `/prescriptions`
  - Admin + Receptionist: `/departments`, `/payments`, `/billing`
  - Admin only: `/reports`, `/users`
  - `/403` → `Unauthorized` page; unknown paths redirect to `/dashboard`
- Sidebar menu visibility is driven by role too (see `common/layout/Sidebar.jsx`).
- **Keep backend + frontend permission tables in sync.** If you change one, update the other.

---

## 5. Database schema (summary)

Full SQL: `Database.txt` — but note it only reflects the *original* `CREATE TABLE` statements.
The running schema also includes the newer **alter migrations** listed below.

Tables (11 domain tables):

1. **roles** — id, name (unique), description
2. **users** — role_id FK→roles, name, email (unique), password (**nullable** since Google
   OAuth users have no local password), phone, **google_id**, **avatar** (Google profile
   picture URL), profile_picture, status (active/inactive)
3. **departments** — name (unique), description, status
4. **doctors** — user_id (unique FK→users, cascade), department_id FK→departments,
   specialization, license_number (unique), gender, date_of_birth, address, **profile_picture**,
   **status (active/inactive/on_leave)**
5. **patients** — patient_code (unique, e.g. `P1001`), first_name, last_name, gender,
   date_of_birth, blood_group, phone, email, **profile_picture**, address, emergency_contact,
   emergency_phone, status
6. **appointments** — patient_id, doctor_id, appointment_date, appointment_time, reason,
   status (pending/confirmed/completed/cancelled), notes
7. **medical_records** — patient_id, doctor_id, appointment_id (unique), symptoms, diagnosis,
   treatment, notes
8. **medicines** — name, category, description, quantity (unsigned), unit, price
   (DECIMAL 10,2), expiry_date, status, **deleted_at (soft deletes)**
9. **prescriptions** — patient_id, doctor_id, medical_record_id, prescription_date, notes
10. **prescription_items** — prescription_id (cascade), medicine_id, quantity, dosage,
    frequency, duration, instruction
11. **payments** — patient_id, appointment_id, amount, payment_method (cash/aba/card),
    payment_status (pending/paid/cancelled), transaction_code (unique), payment_date, notes

### Alter migrations (run on top of the base schema)

- `2026_08_12_014437` — extend doctors.status enum with `on_leave` (raw `DB::statement`).
- `2026_08_17_000000` — add `users.profile_picture` (nullable string).
- `2026_08_17_010000` — add `medicines.deleted_at` (soft deletes).
- `2026_08_18_000000` — add `doctors.profile_picture` (nullable string).
- `2026_08_18_010000` — add `patients.profile_picture` (nullable string).
- `2026_08_21_030410` — add `users.google_id` + `users.avatar` (nullable strings) and make
  `users.password` nullable (for Google OAuth accounts).

Key relationships (Eloquent):
- User 1—1 Doctor; User N—1 Role
- Department 1—N Doctor; Doctor 1—N Appointment / MedicalRecord / Prescription
- Patient 1—N Appointment / MedicalRecord / Prescription / Payment
- Appointment 1—1 MedicalRecord; 1—N Payment
- MedicalRecord 1—N Prescription; Prescription 1—N PrescriptionItem N—1 Medicine
- `User` model has an `avatar_url` accessor: prefers the Google `avatar` URL when present,
  otherwise falls back to `asset('storage/'.$profile_picture)`.
- `Medicine` uses the `SoftDeletes` trait.

### Seeded data (`DatabaseSeeder`)

- Roles: Admin, Doctor, Receptionist (`firstOrCreate`).
- Users (`updateOrCreate` by email, **passwords are NOT `password`**):

| Email                    | Password          | Role        |
|--------------------------|-------------------|-------------|
| `admin@clinic.com`       | `admin12345`      | Admin       |
| `doctor@clinic.com`      | `doctor12345`     | Doctor      |
| `receptionist@clinic.com`| `receptionist12345`| Receptionist|

- One Doctor profile linked to `doctor@clinic.com` (General Medicine, license `LIC-SEED-001`).
- 15 departments (`seedDepartments()`), 8 medicines (`seedMedicines()`, e.g. Paracetamol 500mg).
- No patients are seeded (the patient seed is commented out).

---

## 6. API reference (`backend/routes/api.php`)

All under `/api` prefix. Public: `POST /api/login`, `POST /api/support/send`,
`GET /api/auth/google`, `GET /api/auth/google/callback`.

### Google OAuth (Socialite, stateless)

- `GET /api/auth/google` redirects to Google; `GET /api/auth/google/callback` exchanges the
  code, then finds the user by `google_id` **or email** (linking an existing account) or
  creates one with `role_id = 3` (**Receptionist**, hardcoded), a random 16-char password,
  and the Google avatar.
- The callback ends with a redirect to `{FRONTEND_URL}/auth/callback?token=<sanctum token>`
  (`FRONTEND_URL` env, default `http://localhost:5173`). See §10 for the missing frontend
  handler for this URL.

### Support → Telegram

- `POST /api/support/send` validates `subject` + `message` (plus optional `user_name` /
  `user_email`) and forwards a formatted message to the Telegram Bot API using
  `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` env vars. Works for guests too (falls back to
  "Clinic User" when not authenticated). Returns `{message}` on success, `{error}` + 500 on
  Telegram failure.

Authenticated (`auth:sanctum`):
- `GET /api/me`, `PUT /api/profile`, `PUT /api/password`, `POST /api/logout`
- `GET /api/dashboard`, `/api/dashboard/weekly`, `/api/dashboard/daily-this-month`,
  `/api/dashboard/monthly`
- RESTful: `departments`, `doctors`, `patients`, `appointments`, `medical-records`,
  `prescriptions`, `medicines`, `payments` (per-resource role rules in §4)

Admin-only:
- `apiResource('users')` → `GET/POST/PUT/DELETE /api/users` (full CRUD via `UserController`)
- `GET /api/reports/patients`, `/api/reports/doctors`, `/api/reports/appointments`,
  `/api/reports/payments`, `/api/reports/medicines`

Notes / gotchas:
- **`AppointmentController` lives at `App\Http\Controllers\AppointmentController`**
  (top-level), while all other controllers are under `App\Http\Controllers\Api\`. Keep imports
  in `routes/api.php` consistent with this.
- Response shapes are hand-rolled (not API Resources). Login/me return
  `{ user: { id, name, email, phone, avatar_url, profile_picture, role } }`; login also returns
  `access_token`. Some controllers wrap in `{ success, message, data }` (e.g. `UserController`,
  list endpoints), others return bare arrays/shapes — **inspect the controller before assuming
  a shape**.
- `login` returns **403 "account is currently inactive"** for `status !== 'active'` users.
- `PUT /api/profile` accepts a `profile_picture` file (jpg/jpeg/png/webp, ≤2MB); the file is
  stored to `storage/app/public/profile-pictures` and the old file is deleted on replace.
- Only `StorePatientRequest` exists; other controllers validate inline with
  `$request->validate(...)`.
- Deleting a Doctor or User is blocked (422) if the linked doctor has appointments/medical
  records/prescriptions — the UI should soft-deactivate instead.
- `DoctorController::update` can re-attach an **orphaned** doctor row (its `user_id` was deleted)
  by creating a fresh `User` (default password `doctor7777`).
- Extra env vars the backend may need: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_REDIRECT_URI`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `FRONTEND_URL`.

---

## 7. Frontend structure

### Routing & layout

- `src/App.jsx` is a thin wrapper around `src/routes/AppRoutes.jsx`.
- `AppRoutes.jsx` defines the `APP_ROUTES` array (path → component → allowed roles), groups
  them by role set, and renders each group under `ProtectedRoute` + a shared `DashboardShell`
  (collapsible `Sidebar` + `Navbar` + `<Outlet />`).
- `src/layouts/` (`AdminLayout`, `DoctorLayout`, `RoleRoute`) is **dead code** — nothing imports
  it. Don't resurrect it; use the `AppRoutes.jsx` pattern.

### Shared UI kit (`src/components/ui/`)

- Barrel export in `ui/index.js`: `Button`, `PageHeader`, `Card`, `Badge`, `statusTone`,
  `Field` (+ `TextInput` / `SelectInput` / `TextArea`), `SearchInput`, `Pagination`,
  `EmptyState`, `Modal`, `Table`.
- Feature pages (Doctor, Patients, User, Inventory, Billing, Appointments, …) are built on
  this kit. **Prefer composing these over hand-rolling new buttons/tables/modals/fields.**
  Check an existing page for the established usage pattern before writing a new one.

### URL-synced search (`src/hooks/useUrlSearch.js`)

- `const [term, setTerm] = useUrlSearch()` keeps a page's search box in sync with the
  `?search=` query param (default key `"search"`), so the global navbar search can deep-link
  onto any list page pre-filtered. Use it for new list pages.

### Pages (`src/pages/`)

`Dashboard`, `Appointments`, `Doctor`, `Patients`, `MedicalRecord`, `Prescription`,
`Department`, `Medicine`, `Payment`, **`Inventory`**, **`Billing`**, `Reports`, `User`,
`Profile`, `Settings`, `Support`, `Unauthorized`, plus `Auth/Login`, `Auth/Register`, and
`Auth/Doctor.jsx` (a stray re-export of the `Doctor` page — leave alone unless asked).

Note: `/inventory` and `/billing` are now **full standalone pages** (`Inventory.jsx`,
`Billing.jsx`) — they no longer simply re-render `Medicine`/`Payment`.

- **Login** also offers "Sign in with Google", which hard-navigates to
  `http://localhost:8000/api/auth/google` (hardcoded in `Login.jsx` — update it there if the
  backend host changes).
- **Support** posts to `/api/support/send`; the backend relays the message to Telegram
  (previously it opened a `mailto:` link — that path is gone).

### i18n & locale

- `src/context/LocaleContext.jsx` provides `{ locale, t, setLocale, localizedPath }`.
- Two locales: **`km` (default, no URL prefix)** and **`en` (`/en` URL prefix)**. Detection and
  path rewriting live in `src/utils/localizedPath.js`.
- All UI strings come from `src/i18n/translations.js` — **when you add UI text, add it for BOTH
  `km` and `en`** and render via `t("key", { vars })` (see `LanguageSwitcher.jsx` in the Navbar).
- `ProtectedRoute`, login redirects, and the axios interceptor all respect the locale prefix.

### Services (`src/services/`)

`api.js` (re-exports the shared instance from `src/api/axios.js`) + `appointmentService`,
`dashboardService`, `doctorService`, `medicalRecordService`, `medicineService`,
`patientService`, `paymentService`, `prescriptionService`, `reportService`, `userService`.
New API calls should go through `api.js` (or a resource service importing it) so auth
headers/401/403 handling apply.

### State

- `AuthContext` provides `{ user, token, login, logout, loading, updateProfile,
  changePassword }`. `updateProfile` supports both plain JSON and `FormData` (for
  `profile_picture` uploads, sent as a `POST` with `_method: PUT`).
- `ThemeContext` handles dark/light mode (Tailwind `dark:` classes).
- `LocaleContext` handles language. No Redux / react-query — keep using context + local state.

### Styling

Tailwind CSS v4 (utility classes in JSX). Support dark mode via `dark:` variants. Reuse
existing components (modal/table/form patterns in `components/`) instead of inventing new
ones.

Khmer font: **Kantumruy Pro** (Google Fonts), imported in `src/index.css` with weights
`400;600;700`. It is applied globally to `html` and forced across all elements when the locale
is Khmer (`html[lang="km"]`, `:lang(km)`). For prominent headings/titles use the `.khmer-title`
utility class (`font-family: 'Kantumruy Pro', sans-serif; font-weight: 700`). Do not introduce
other Khmer fonts.

---

## 8. Common commands

### Backend (Laravel 10, served by Laragon at 127.0.0.1:8000)
```bash
cd backend
composer install
copy .env.example .env          # set DB_DATABASE=clinic_management, DB_USERNAME=root, DB_PASSWORD=
php artisan key:generate
php artisan migrate --seed      # build schema + seed roles/users/departments/medicines
php artisan storage:link        # needed so profile pictures (storage/profile-pictures) are served
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
   `src/utils/permissions.js` and the `APP_ROUTES` groups in `src/routes/AppRoutes.jsx` to match.
5. **New UI text must be localized.** Add `km` AND `en` keys to `src/i18n/translations.js` and
   render through `useLocale().t(...)`; don't hardcode visible labels in JSX.
6. **Don't commit secrets.** `.env` files and `node_modules`/`vendor` are git-ignored; keep it
   that way. Never write real credentials into code or docs.
7. **Don't add code comments unless asked.** Keep the codebase's current minimal-comment style.
8. **Verify work.** Backend: `php artisan test` (PHPUnit) or manual Postman-style curl;
   frontend: `npm run build` / `npm run lint`. There are currently no dedicated test suites
   for the app domain beyond Laravel's `ExampleTest` stubs.
9. **Docs files `plan.txt`/`Structure.txt`/`Database.txt` are historical.** Trust the code, not
   the docs, when they disagree (e.g., `Database.txt` predates the alter migrations; `Structure.txt`
   predates `routes/AppRoutes.jsx`, `api/axios.js`, `i18n/`; `AppointmentController` lives at
   top level; doctor status includes `on_leave`).

---

## 10. Known gaps / things to be careful with

- **Register page exists but no backend register endpoint** — `Register.jsx` has no working
  API to call.
- **Google OAuth callback has no frontend handler yet.** The backend redirects to
  `{FRONTEND_URL}/auth/callback?token=...`, but `AppRoutes.jsx` defines no `/auth/callback`
  route, so the wildcard rule just bounces to `/dashboard` **without storing the token** —
  Google sign-in currently does not complete a login. A handler page that persists the token
  (same `localStorage` key `token`) and redirects is still to be built.
- **Support page depends on Telegram env vars.** If `TELEGRAM_BOT_TOKEN` /
  `TELEGRAM_CHAT_ID` are missing, `/api/support/send` returns 500.
- The Login page's Google button hardcodes `http://localhost:8000` (not `127.0.0.1`) and
  ignores the axios baseURL / locale prefix.
- **`src/layouts/` is dead code** (`AdminLayout`, `DoctorLayout`, `RoleRoute` are unimported).
  Routing/layout now lives entirely in `src/routes/AppRoutes.jsx`.
- `AuthContext.jsx` sets `axios.defaults.baseURL` while `services/api.js` uses its own instance
  (`src/api/axios.js`) with the same base URL — keep both pointing at `http://127.0.0.1:8000/api`.
- Seeded login passwords are `admin12345` / `doctor12345` / `receptionist12345` — **not** `password`.
- `users.status` only supports `active`/`inactive`, but `doctors.status` also supports `on_leave`.
  `DoctorController` deliberately keeps them independent (`on_leave` → user stays `active`).
- Doctor status enum was extended to include `on_leave` via a raw `DB::statement` migration;
  any revert must clean `on_leave` rows first.
- Deleting a user/doctor that has clinical history is blocked server-side (422); handle the
  deactivate-instead-of-delete flow in the UI rather than bypassing it.
- Doctor/Patient profile pictures live in `storage/app/public` — run `php artisan storage:link`
  or avatars 404.
- `Auth/Doctor.jsx` is a stray re-export of the `Doctor` page (an intentional leftover? unconfirmed) —
  don't delete it without asking.
- `Doctor` profile data is linked to `users` via `user_id` (1:1); creating a doctor also
  needs a `User` row. Check `DoctorController` before assuming how doctor creation works.
