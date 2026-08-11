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
    <div className="min-h-screen bg-slate-50 relative">
      {/* Sidebar - Fixed w-64 */}
      <Sidebar />

      {/* Main Content Area - Placed to the right of the sidebar with pl-64 */}
      <div className="lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Navbar */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
                GENERAL PROTECTED ROUTES
                Admin + Doctor + Receptionist
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
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/medical-records" element={<MedicalRecords />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                </Route>
            </Route>

            {/* =================================
                MEDICINE ROUTES
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
                    <Route path="/medicines" element={<Medicines />} />
                </Route>
            </Route>

            {/* =================================
                PAYMENT ROUTES
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
                    <Route path="/payments" element={<Payments />} />
                </Route>
            </Route>

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