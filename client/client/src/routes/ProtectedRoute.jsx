import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ roles = [], children }) => {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
