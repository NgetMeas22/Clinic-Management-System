import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-4 text-red-500 font-medium">
        You do not have permission to view this page.
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
