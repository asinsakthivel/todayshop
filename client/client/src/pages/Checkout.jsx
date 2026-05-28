import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Checkout = () => {
  const { role } = useAuth();

  if (role === "buyer") return <Navigate to="/buyer/checkout" replace />;
  if (role === "seller") return <Navigate to="/seller/orders" replace />;
  if (role === "deliveryPartner") return <Navigate to="/delivery/tasks" replace />;

  return <Navigate to="/login" replace />;
};

export default Checkout;
