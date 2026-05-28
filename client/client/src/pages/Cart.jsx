import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Cart = () => {
  const { role } = useAuth();

  if (role === "buyer") return <Navigate to="/buyer/cart" replace />;
  if (role === "seller") return <Navigate to="/seller/products" replace />;
  if (role === "deliveryPartner") return <Navigate to="/delivery/kyc" replace />;

  return <Navigate to="/login" replace />;
};

export default Cart;
