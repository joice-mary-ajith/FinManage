import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

// Login/Register pages: a user who is already logged in is sent to their home page instead.
export default function PublicRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace /> : <Outlet />;
}
