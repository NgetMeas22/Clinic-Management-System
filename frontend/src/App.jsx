import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/common/layout/Navbar";
import Sidebar from "./components/common/layout/Sidebar";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Doctor from "./pages/Doctor";
import Patients from "./pages/Patients";
import MedicalRecords from "./pages/MedicalRecord";
import Prescriptions from "./pages/Prescription";
import Departments from "./pages/Department";

import Medicines from "./pages/Medicine";
import Payments from "./pages/Payment";
import Reports from "./pages/Reports";
import User from "./pages/User";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Unauthorized from "./pages/Unauthorized";

// ========================================
// Dashboard Layout
// ========================================

function DashboardShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative dark:bg-slate-950">
      {/* Sidebar - Fixed w-64 */}
      <Sidebar />

      {/* Main Content Area - Placed to the right of the sidebar with pl-64 */}
      <div className="lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Navbar */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ========================================
// App
// ========================================

function App() {
    return (
        <Routes>
            {/* =================================
                PUBLIC ROUTES
            ================================= */}
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* =================================
                SHARED PROTECTED ROUTES
            ================================= */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "Admin",
                            "Doctor",
                            "Receptionist",
                        ]}
                    />
                }
            >
                <Route element={<DashboardShell />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/doctors" element={<Doctor />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/medicines" element={<Medicines />} />
                    <Route path="/inventory" element={<Medicines />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/support" element={<Support />} />
                </Route>
            </Route>

            {/* =================================
                CLINICAL ROUTES
                Admin + Doctor
            ================================= */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Admin", "Doctor"]}
                    />
                }
            >
                <Route element={<DashboardShell />}>
                    <Route path="/medical-records" element={<MedicalRecords />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                </Route>
            </Route>

            {/* =================================
                FRONT DESK ROUTES
                Admin + Receptionist
            ================================= */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Admin", "Receptionist"]}
                    />
                }
            >
                <Route element={<DashboardShell />}>
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/billing" element={<Payments />} />
                </Route>
            </Route>

            {/* =================================
                ADMIN ROUTES
            ================================= */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Admin"]}
                    />
                }
            >
                <Route element={<DashboardShell />}>
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/users" element={<User />} />
                </Route>
            </Route>

            <Route path="/403" element={<Unauthorized />} />

            {/* =================================
                NOT FOUND
            ================================= */}
            <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
            />
        </Routes>
    );
}

export default App;
