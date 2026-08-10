import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/common/layout/Navbar";
import Sidebar from "./components/common/layout/Sidebar";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Doctor from "./pages/Doctor"; // Imported as 'Doctor'
import Patients from "./pages/Patients";
import MedicalRecords from "./pages/MedicalRecord";
import Prescriptions from "./pages/Prescription";
import Departments from "./pages/Department";

function DashboardShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]} />}>
        <Route element={<DashboardShell />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/doctors" element={<Doctor />} /> 
          <Route path="/patients" element={<Patients />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;