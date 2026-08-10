# Agent Guide

This repository is a clinic management system with a Laravel 10 backend and a React 19 + Vite frontend. Use this file as the first stop when an AI agent needs to understand the project structure, conventions, and main entry points.

## Project Overview

- Backend: Laravel API in `backend/`
- Frontend: React app in `frontend/`
- API auth: Laravel Sanctum bearer tokens
- Main domain areas: authentication, departments, doctors, patients, appointments

## High-Level Architecture

- The backend exposes JSON API endpoints under `/api`.
- The frontend uses Axios to call the backend on `http://127.0.0.1:8000/api`.
- Login stores a token in `localStorage` and attaches it to all future requests.
- Protected frontend routes depend on the auth context and role checks.

## Backend Structure

Important folders and files:

- `backend/routes/api.php` - API route definitions
- `backend/app/Http/Controllers/Api/AuthController.php` - login, me, logout
- `backend/app/Http/Controllers/Api/DepartmentController.php` - department CRUD
- `backend/app/Http/Controllers/Api/DoctorController.php` - doctor CRUD and user creation
- `backend/app/Http/Controllers/Api/PatientController.php` - patient CRUD
- `backend/app/Http/Controllers/AppointmentController.php` - appointment CRUD
- `backend/app/Models/` - Eloquent models
- `backend/database/migrations/` - table schemas

### Backend Stack

- PHP `^8.1`
- Laravel `^10.10`
- Sanctum `^3.3`

### Backend Route Summary

- `POST /api/login` - public login
- `GET /api/me` - authenticated user profile
- `POST /api/logout` - token logout
- `apiResource('departments')`
- `apiResource('doctors')`
- `apiResource('patients')`
- `apiResource('appointments')`

All resource routes are protected by `auth:sanctum`.

## Backend Domain Notes

### Auth

- `AuthController@login` validates email and password.
- It loads the related `role`.
- It rejects inactive accounts with `403`.
- It returns a Sanctum token plus a simplified user object.

### Doctors

- Creating a doctor creates both a `users` row and a `doctors` row in a transaction.
- `role_id` is hardcoded to `2` when creating doctors.
- The default doctor password is currently set to `doctor7777`.
- Updates also sync the linked `User` record.
- Deletes remove the doctor and its linked user.

### Patients

- Patient lookup supports `search` across:
  - `first_name`
  - `last_name`
  - `patient_code`
  - `phone`
  - `email`
- Results are paginated with 10 items per page.

### Appointments

- Appointments load `patient` and `doctor` relationships.
- Search currently matches patient first or last name.
- Optional `status` filtering is supported.
- Status values used in validation:
  - `pending`
  - `confirmed`
  - `completed`
  - `cancelled`

## Model Relationships

### `User`

- Belongs to `Role`
- Has one `Doctor`

### `Doctor`

- Belongs to `User`
- Belongs to `Department`
- Has many `Appointment`
- Has many `MedicalRecord`
- Has many `Prescription`

### `Patient`

- Has many `Appointment`
- Has many `MedicalRecord`
- Has many `Prescription`
- Has many `Payment`

### `Appointment`

- Belongs to `Patient`
- Belongs to `Doctor`
- Has one `MedicalRecord`
- Has many `Payment`

### `Department`

- Has many `Doctor`

## Frontend Structure

Important files:

- `frontend/src/main.jsx` - app bootstrap
- `frontend/src/App.jsx` - routes and dashboard layout
- `frontend/src/context/AuthContext.jsx` - auth state and session bootstrap
- `frontend/src/components/ProtectedRoute.jsx` - route guard
- `frontend/src/services/api.js` - Axios instance and token interceptor
- `frontend/src/services/patientService.js` - patient API helpers
- `frontend/src/services/doctorService.js` - doctor API helpers
- `frontend/src/pages/Login.jsx` - login screen
- `frontend/src/pages/patients/Patients.jsx` - patient list and modal CRUD UI
- `frontend/src/components/Doctors.jsx` - doctor UI

### Frontend Stack

- React `19`
- Vite
- React Router DOM `7`
- Axios
- Tailwind CSS `4`

### Frontend Auth Flow

- `AuthContext` reads `token` from `localStorage`.
- If a token exists, it requests `GET /me`.
- If `/me` fails, it logs the user out.
- `login(email, password)` stores the returned token and user.
- `logout()` clears local storage and authorization headers.

### Frontend Routing

- `/login` is public
- `/dashboard`, `/doctors`, `/patients` are protected
- Allowed roles in `App.jsx`:
  - `Admin`
  - `Doctor`
  - `Receptionist`

## API Response Shape

The backend is not fully uniform, so frontend code sometimes has to handle multiple shapes.

Common patterns:

- Some endpoints return `{ success, message, data }`
- Some return nested pagination data like `response.data.data.data`
- Auth returns `{ message, access_token, token_type, user }`

When adding new frontend calls, inspect the controller response before assuming the payload shape.

## Coding Conventions Observed

- Controllers often wrap logic in `try/catch` and return JSON error payloads.
- Validation is done directly in controller methods.
- CRUD endpoints generally use Eloquent `create`, `update`, `delete`, and `findOrFail`.
- Frontend service functions are thin wrappers around Axios calls.
- UI code is mostly functional React components with local state.

## Things To Watch Carefully

- Some files contain odd character encoding artifacts in comments or placeholder text. Avoid “fixing” unrelated text unless necessary.
- `DoctorController` depends on both `users` and `doctors` tables staying in sync.
- `AppointmentController@show`, `update`, and `destroy` use route model binding with `Appointment $appointment`.
- `PatientController` requires `patient_code` and `gender` on create/update.
- `AuthContext` and `frontend/src/services/api.js` both manage Axios headers. Be careful not to duplicate or conflict with token handling.

## Useful Working Assumptions

- Local development backend URL is `http://127.0.0.1:8000`
- Local development frontend URL is likely the default Vite port unless configured otherwise
- Database structure is driven by Laravel migrations in `backend/database/migrations`

## Recommended Workflow For Future Changes

1. Check the backend controller and model first.
2. Confirm the API response shape.
3. Update or add a frontend service helper.
4. Wire the UI to the service.
5. Verify auth and role restrictions if the route is protected.
6. Keep changes aligned with the existing simple CRUD style unless refactoring the whole feature.

## Short Project Summary For Agents

This is a Laravel Sanctum API plus React dashboard for a clinic. The main entities are users, roles, doctors, departments, patients, and appointments. Most work involves CRUD screens, token-based auth, and keeping frontend service calls aligned with controller response shapes.
