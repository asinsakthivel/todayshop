import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import useSocket from "../hooks/useSocket.js";

const SellerApprovalPending = () => {
  const { user, refreshUser } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const status = user?.approvalStatus || "pending";
  const rejected = status === "rejected";

  useEffect(() => {
    if (status === "approved") {
      navigate("/seller");
    }
  }, [navigate, status]);

  useEffect(() => {
    const socketClient = socket.current;
    const handleUserUpdate = (payload) => {
      if (payload?.type === "SELLER_APPROVAL") {
        refreshUser().catch(() => {});
      }
    };

    socketClient?.on("userUpdate", handleUserUpdate);
    return () => socketClient?.off("userUpdate", handleUserUpdate);
  }, [refreshUser, socket]);

  return (
    <div className="container py-5" style={{ maxWidth: "760px" }}>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5">
          <span className={`badge ${rejected ? "text-bg-danger" : "text-bg-warning"} mb-3`}>
            Seller Review
          </span>
          <h2 className="mb-3">
            {rejected ? "Seller Registration Rejected" : "Seller Registration Submitted"}
          </h2>
          <p className="text-muted mb-4">
            {rejected
              ? "Your seller account is not approved yet. Please contact the admin team before trying to access the seller dashboard."
              : "Your seller account is now in the waiting list. Only after admin approval will you be able to log in and open the seller dashboard."}
          </p>
          {user?.approvalNote ? (
            <div className={`alert ${rejected ? "alert-danger" : "alert-warning"}`}>
              Admin note: {user.approvalNote}
            </div>
          ) : null}
          <div className="d-flex flex-wrap gap-3">
            <Link className="btn btn-dark" to="/login">Go to Login</Link>
            <Link className="btn btn-outline-secondary" to="/products">Browse Products</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerApprovalPending;
