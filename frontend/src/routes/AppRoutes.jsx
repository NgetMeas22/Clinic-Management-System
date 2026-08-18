import { useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import ProtectedRoute from "../components/ProtectedRoute";

import Navbar from "../components/common/layout/Navbar";
import Sidebar from "../components/common/layout/Sidebar";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";

import Dashboard from "../pages/Dashboard";
import Appointments from "../pages/Appointments";
import Doctor from "../pages/Doctor";
import Patients from "../pages/Patients";
import MedicalRecords from "../pages/MedicalRecord";
import Prescriptions from "../pages/Prescription";
import Departments from "../pages/Department";

import Medicines from "../pages/Medicine";
import Payments from "../pages/Payment";
import Inventory from "../pages/Inventory";
import Billing from "../pages/Billing";
import Reports from "../pages/Reports";
import User from "../pages/User";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Support from "../pages/Support";
import Unauthorized from "../pages/Unauthorized";

const ALL_ROLES = ["Admin", "Doctor", "Receptionist"];

const APP_ROUTES = [
  { path: "dashboard", element: <Dashboard />, roles: ALL_ROLES },
  { path: "appointments", element: <Appointments />, roles: ALL_ROLES },
  { path: "doctors", element: <Doctor />, roles: ALL_ROLES },
  { path: "patients", element: <Patients />, roles: ALL_ROLES },
  { path: "medicines", element: <Medicines />, roles: ALL_ROLES },
  { path: "inventory", element: <Inventory />, roles: ALL_ROLES },
  { path: "profile", element: <Profile />, roles: ALL_ROLES },
  { path: "settings", element: <Settings />, roles: ALL_ROLES },
  { path: "support", element: <Support />, roles: ALL_ROLES },
  { path: "medical-records", element: <MedicalRecords />, roles: ["Admin", "Doctor"] },
  { path: "prescriptions", element: <Prescriptions />, roles: ["Admin", "Doctor"] },
  { path: "departments", element: <Departments />, roles: ["Admin", "Receptionist"] },
  { path: "payments", element: <Payments />, roles: ["Admin", "Receptionist"] },
  { path: "billing", element: <Billing />, roles: ["Admin", "Receptionist"] },
  { path: "reports", element: <Reports />, roles: ["Admin"] },
  { path: "users", element: <User />, roles: ["Admin"] },
];

function DashboardShell() {
  const { user, logout } = useAuth();
  const { localizedPath } = useLocale();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(localizedPath("/login"));
  };

  const mainPaddingClass = sidebarCollapsed ? "lg:pl-20" : "lg:pl-64";

  return (
    <div className="min-h-screen bg-slate-50 relative dark:bg-slate-950">
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <div
        className={`min-h-screen flex flex-col transition-[padding] duration-300 ${mainPaddingClass}`}
      >
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-1 bg-slate-50 px-4 py-4 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function renderProtected() {
  const groups = new Map();
  APP_ROUTES.forEach((route) => {
    const key = route.roles.join("|");
    if (!groups.has(key)) {
      groups.set(key, { roles: route.roles, children: [] });
    }
    groups.get(key).children.push(route);
  });

  return [...groups.values()].map((group) => (
    <Route
      key={group.roles.join("-")}
      element={<ProtectedRoute allowedRoles={group.roles} />}
    >
      <Route element={<DashboardShell />}>
        {group.children.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Route>
  ));
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/403" element={<Unauthorized />} />
      {renderProtected()}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

      <Route path="/en">
        <Route index element={<Navigate to="/en/dashboard" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="403" element={<Unauthorized />} />
        {renderProtected()}
        <Route path="*" element={<Navigate to="/en/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
