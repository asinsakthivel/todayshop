import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Products = () => {
  const { role } = useAuth();

  if (role === "seller") return <Navigate to="/seller/products" replace />;
  if (role === "buyer") return <Navigate to="/buyer" replace />;
  if (role === "deliveryPartner") return <Navigate to="/delivery/kyc" replace />;

  return <Navigate to="/login" replace />;
};

export default Products;
