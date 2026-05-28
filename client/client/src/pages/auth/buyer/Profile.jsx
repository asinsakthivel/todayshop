import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios.js";
import BuyerReviewModal from "../../../components/BuyerReviewModal.jsx";
import OrderTimeline from "../../../components/OrderTimeline.jsx";
import "react-toastify/dist/ReactToastify.css";
import { normalizeDeliveryStatus } from "../../../lib/deliveryStatus.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [orders, setOrders] = useState([]);
  const [reviewOrder, setReviewOrder] = useState(null);

  const loadOrders = async () => {
    const { data } = await api.get("/buyer/orders");
    setOrders(data || []);
  };

  const syncForm = (data) => {
    setForm({
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
    });
  };

  useEffect(() => {
    api.get("/buyer/profile").then(({ data }) => {
      setUser(data);
      syncForm(data);
    });
    void loadOrders();
  }, []);

  const save = async () => {
    const { data } = await api.put("/buyer/profile", { name: form.name, phone: form.phone });
    setUser(data);
    syncForm(data);
  };

  if (!user) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h4 className="mb-3">Profile</h4>
      <div className="card card-body border-0 mb-4">
        <div className="row g-3">
          <div className="col-12">
            <strong className="d-block mb-1">Saved profile</strong>
            <div className="text-muted">This is your current buyer account information.</div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Name</div>
              <div>{user.name || "—"}</div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Phone</div>
              <div>{user.phone || "—"}</div>
            </div>
          </div>
          <div className="col-sm-12">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Email</div>
              <div>{user.email || "—"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card card-body border-0 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <strong className="d-block mb-1">Order history</strong>
            <div className="text-muted">Track your latest buyer orders from here.</div>
          </div>
          <Link to="/buyer/orders" className="btn btn-outline-secondary btn-sm">View all</Link>
        </div>
        {orders.length ? (
          orders.slice(0, 3).map((order) => (
            <div key={order._id} className="border rounded-3 p-3 mb-3 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <div className="fw-semibold">Order #{order._id.slice(-6).toUpperCase()}</div>
                  <div className="text-muted small">{formatCurrency(order.totalAmount)} · {order.items?.length || 0} items</div>
                </div>
                <div className="d-flex gap-2">

                    <Link
                      to={`/buyer/orders/${order._id}`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Details
                    </Link>
                    {normalizeDeliveryStatus(order.orderStatus) === "DELIVERED" && !order.reviewSubmitted && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setReviewOrder(order)}
                      >
                        Write Review
                      </button>
                    )}
                  </div>

              </div>
              <OrderTimeline status={order.orderStatus} />
            </div>
          ))
        ) : (
          <div className="border rounded-3 p-4 bg-white text-center text-muted">No recent orders yet.</div>
        )}
      </div>
      <BuyerReviewModal
        order={reviewOrder}
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        onSubmitted={() => {
          void loadOrders();
        }}
      />
      <div className="card card-body shadow-sm">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" value={form.email} disabled readOnly />
        </div>
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
};

export default Profile;
