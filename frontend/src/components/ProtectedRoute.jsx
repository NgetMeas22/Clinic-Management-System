import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import Unauthorized from "../pages/Unauthorized";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const { localizedPath } = useLocale();

  if (loading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to={localizedPath("/login")} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Unauthorized />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
