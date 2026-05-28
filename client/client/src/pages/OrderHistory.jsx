import { useEffect, useState } from "react";
import api from "../lib/api";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/order/history")
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p>Loading orders...</p></div>;

  return (
    <div className="card">
      <h5>Order history</h5>
      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="list-group">
          {orders.map((o) => (
            <div key={o._id} className="list-group-item">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="fw-semibold">#{o._id.slice(-6)}</div>
                  <div className="text-muted small">{o.address?.line}</div>
                </div>
                <div className="text-muted small text-end">
                  <div>{o.orderStatus}</div>
                  <div>Rs {o.totalAmount}</div>
                  <div>{new Date(o.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
