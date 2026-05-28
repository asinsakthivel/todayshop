import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios.js";
import BuyerReviewModal from "../../../components/BuyerReviewModal.jsx";
import useSocket from "../../../hooks/useSocket.js";
import OrderTimeline from "../../../components/OrderTimeline.jsx";
import { getDeliveryStatusBadge, getDeliveryStatusLabel, normalizeDeliveryStatus } from "../../../lib/deliveryStatus.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [reviewOrder, setReviewOrder] = useState(null);
  const socket = useSocket();

  const loadOrders = useCallback(async () => {
    const { data } = await api.get("/buyer/orders");
    setOrders(data);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const socketClient = socket.current;

    // Reload orders on any orderUpdate payload.
    // Completion/status changes must also trigger this.
    const handler = () => {
      void loadOrders();
    };

    socketClient?.on("orderUpdate", handler);
    return () => socketClient?.off("orderUpdate", handler);
  }, [loadOrders, socket]);


  return (
    <div className="container py-2">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">User Dashboard</span>
          <h3 className="mb-1">My orders</h3>
          <p className="text-muted mb-0">Track each order live from seller confirmation to doorstep delivery.</p>
        </div>
        <div className="order-summary-chip">
          <div className="small text-muted">Orders placed</div>
          <div className="fw-semibold">{orders.length}</div>
        </div>
      </div>

      {orders.length ? (
        <div className="row g-4">
          {orders.map((order) => {
            const currentStatus = normalizeDeliveryStatus(order.orderStatus);
            return (
              <div className="col-12" key={order._id}>
                <div className="card shadow-sm border-0 order-management-card">
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-xl-row justify-content-between gap-4">
                      <div className="d-flex gap-3 flex-grow-1">
                        <img
                          src={order.productImage || "https://placehold.co/120x120?text=Order"}
                          alt={order.productName}
                          className="order-card-image"
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <span className={`badge text-bg-${getDeliveryStatusBadge(order.orderStatus)}`}>{getDeliveryStatusLabel(order.orderStatus)}</span>
                            <span className="text-muted small">Order #{order._id}</span>
                          </div>
                          <h5 className="mb-1">{order.productName}</h5>
                          <div className="text-muted small mb-3">Placed on {new Date(order.orderDate || order.createdAt).toLocaleString()}</div>

                          <div className="row g-3 small mb-3">
                            <div className="col-sm-6 col-lg-3">
                              <div className="text-muted text-uppercase order-meta-label">Quantity</div>
                              <div className="fw-semibold">{order.quantity}</div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="text-muted text-uppercase order-meta-label">Price</div>
                              <div className="fw-semibold">{formatCurrency(order.subTotal)}</div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="text-muted text-uppercase order-meta-label">Delivery Charge</div>
                              <div className="fw-semibold">{formatCurrency(order.deliveryCharge)}</div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                              <div className="text-muted text-uppercase order-meta-label">Total Amount</div>
                              <div className="fw-semibold">{formatCurrency(order.totalAmount)}</div>
                            </div>
                          </div>

                          <OrderTimeline status={currentStatus} />
                        </div>
                      </div>

                      <div className="order-card-sidepanel">
                        <div className="small text-muted mb-1">Delivery to</div>
                        <div className="fw-semibold mb-2">{order.customerName}</div>
                        <div className="text-muted small mb-3">{order.address}</div>
                        {normalizeDeliveryStatus(order.orderStatus) === "DELIVERED" && !order.reviewSubmitted && (
                          <button type="button" className="btn btn-primary w-100 mb-2" onClick={() => setReviewOrder(order)}>

                            <i className="bi bi-star me-2"></i>Write Review
                          </button>
                        )}
                        <Link to={`/buyer/orders/${order._id}`} className="btn btn-outline-dark w-100">View Details</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="card-body p-5 text-center text-muted">No orders yet. Your placed orders will appear here with live delivery updates.</div>
        </div>
      )}

      <BuyerReviewModal
        order={reviewOrder}
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        onSubmitted={() => {
          void loadOrders();
        }}
      />
    </div>
  );
};

export default Orders;
