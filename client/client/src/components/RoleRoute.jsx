import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const RoleRoute = ({ role, children }) => {
  const { role: currentRole } = useAuth();
  if (currentRole !== role) return <Navigate to="/" replace />;
  return children;
};

export default RoleRoute;
