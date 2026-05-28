import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import useSocket from "../../hooks/useSocket.js";
import { useAuth } from "../../context/AuthContext.jsx";
import NotificationBell from "../../components/NotificationBell.jsx";

import "react-toastify/dist/ReactToastify.css";


const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard = () => {
  const socket = useSocket();
  const { refreshUser } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayEarnings: 0,
    notifications: [],
    unreadNotifications: 0,
    recentOrders: [],
    topProducts: [],
    recentOrderHighlights: [],
    activeProducts: 0,
  });
  const [seller, setSeller] = useState(null);



  const load = useCallback(async () => {
    // Load independently so one failing endpoint doesn't hide notifications.
    try {
      const [analyticsRes] = await Promise.all([api.get("/seller/analytics")]);
      setAnalytics(analyticsRes.data);

      // Optional calls
      api
        .get("/seller/profile")
        .then((sellerRes) => setSeller(sellerRes.data))
        .catch((err) => {
          console.warn("[SellerDashboard] profile failed", err?.response?.data || err);
        });

      // Fetch seller reviews from the same endpoint used by /seller/reviews
      api
        .get("/seller/reviews")
        .then((reviewsRes) => {
          setAnalytics((prev) => ({ ...prev, reviews: reviewsRes.data }));
        })
        .catch((err) => {
          console.warn("[SellerDashboard] reviews failed", err?.response?.data || err);
        });

      console.debug("[SellerDashboard] /seller/analytics", analyticsRes.data);
    } catch (err) {
      console.error("[SellerDashboard] Failed to load seller analytics", err);
      toast.error(err.response?.data?.message || "Failed to load sellerdashboard");
    }
  }, []);



  useEffect(() => {
    // Load dashboard analytics and notifications.
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);




  useEffect(() => {
    const socketClient = socket.current;
    const handler = (payload) => {
      if (payload?.type === "NEW_ORDER_RECEIVED") {
        toast.info("New Order Received");
      }
      void load();
    };

    socketClient?.on("orderUpdate", handler);
    return () => socketClient?.off("orderUpdate", handler);
  }, [load, socket]);

  useEffect(() => {
    const socketClient = socket.current;
    const handleUserUpdate = (payload) => {
      if (payload?.type === "SELLER_APPROVAL") {
        refreshUser().catch(() => {});
        void load();
      }
    };

    socketClient?.on("userUpdate", handleUserUpdate);
    return () => socketClient?.off("userUpdate", handleUserUpdate);
  }, [load, refreshUser, socket]);

  return (
    <div className="container py-2">
      <div className="dashboard-hero mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">Seller Dashboard</span>
          <h2 className="mb-1">{seller?.shopName || seller?.name || "Your shop"}</h2>
          <p className="text-muted mb-0">Order notifications first, then your products.</p>
        </div>
        <Link to="/seller/orders" className="btn btn-dark">
          Orders
        </Link>
      </div>

      {seller?.approvalStatus && seller.approvalStatus !== "approved" ? (
        <div className={`alert ${seller.approvalStatus === "rejected" ? "alert-danger" : "alert-warning"} mb-4`}>
          Seller account status: <strong>{seller.approvalStatus}</strong>.
          {seller.approvalNote ? ` Admin note: ${seller.approvalNote}` : " Your account is waiting for admin review."}
        </div>
      ) : null}

      <div className="row g-4 mb-4">
       

        {/* 2) Pending orders CTA */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div>
                  <h5 className="mb-1">orders</h5>
                  <p className="text-muted small mb-0">
                    Accept, pack, and push orders into the delivery workflow.
                  </p>
                </div>
                <span className="badge rounded-pill text-bg-primary px-3 py-2">
                  {analytics.pendingOrders} live orders
                </span>
              </div>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <Link to="/seller/orders" className="btn btn-dark">
                  Open Orders
                </Link>
                <Link to="/seller/analytics" className="btn btn-outline-dark">
                  View Analytics
                </Link>
              </div>

              {analytics.recentOrderHighlights?.length ? (
                <div className="mt-3">
                  <div className="text-muted small mb-2">Recent highlights</div>
                  <div className="list-group list-group-flush">
                    {analytics.recentOrderHighlights.slice(0, 4).map((h) => (
                      <div
                        key={h.id}
                        className="list-group-item d-flex justify-content-between align-items-center gap-3"
                      >
                        <div className="min-width-0">
                          <div className="fw-semibold text-truncate">Order #{h.id}</div>
                          <div className="text-muted small">
                            {h.customerName} • {h.statusMeta?.label || h.orderStatus}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">{formatCurrency(h.totalAmount)}</div>
                          <Link to={`/seller/orders/${h.id}`} className="small">
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="alert alert-light border mb-0 mt-3">
                  No order highlights yet. New buyer orders will appear automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3) Products after notifications */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h5 className="mb-1">Products</h5>
              <p className="text-muted small mb-0">Manage your catalog after handling orders.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge text-bg-secondary px-3 py-2">
                Active: {analytics.activeProducts ?? 0}
              </span>
              <Link to="/seller/products" className="btn btn-outline-dark">
                Go to Products
              </Link>
            </div>
          </div>

          {analytics.topProducts?.length ? (
            <div className="row g-3">
              {analytics.topProducts.slice(0, 6).map((p) => (
                <div key={p._id} className="col-12 col-md-6 col-lg-4">
                  <div className="d-flex gap-3 align-items-center p-3 rounded-4 border h-100">
                    <img
                      src={p.images?.[0] || "https://placehold.co/96x96?text=Product"}
                      alt={p.name}
                      style={{ width: 64, height: 64, objectFit: "cover" }}
                      className="rounded-3"
                    />
                    <div className="min-width-0">
                      <div className="fw-semibold text-truncate">{p.name}</div>
                      <div className="text-muted small text-truncate">{p.category || "Uncategorized"}</div>
                      <div className="small mt-1">
                        <span className={`badge ${p.isAvailable ? "bg-success" : "bg-danger"}`}>
                          {p.isAvailable ? "In stock" : "Out of stock"}
                        </span>
                      </div>
                    </div>
                    <div className="ms-auto">
                      <div className="fw-semibold">{formatCurrency(p.price)}</div>
                      <Link to={`/seller/products/${p._id}`} className="small d-block mt-1">
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border mb-0">
              No products found. Add products to start selling.
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Dashboard;
