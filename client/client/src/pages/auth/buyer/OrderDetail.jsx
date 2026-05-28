import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api/axios.js";
import OrderTimeline from "../../../components/OrderTimeline.jsx";
import useSocket from "../../../hooks/useSocket.js";
import { getDeliveryStatusBadge, getDeliveryStatusLabel } from "../../../lib/deliveryStatus.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const socket = useSocket();

  const load = useCallback(async () => {
    const { data } = await api.get(`/order/${id}`);
    setOrder(data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socketClient = socket.current;
    const handler = (payload) => {
      if (payload.orderId === id) {
        void load();
      }
    };

    socketClient?.on("orderUpdate", handler);
    return () => socketClient?.off("orderUpdate", handler);
  }, [id, load, socket]);

  if (!order) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-2">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">Order Tracking</span>
          <h3 className="mb-1">{order.productName}</h3>
          <p className="text-muted mb-0">Order #{order._id} updates in real time as the seller and delivery partner progress it.</p>
        </div>
        <span className={`badge text-bg-${getDeliveryStatusBadge(order.orderStatus)} px-3 py-2`}>{getDeliveryStatusLabel(order.orderStatus)}</span>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h5 className="mb-0">Status timeline</h5>
            <span className="text-muted small">Placed on {new Date(order.orderDate || order.createdAt).toLocaleString()}</span>
          </div>
          <OrderTimeline status={order.orderStatus} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">Order summary</h5>
              <div className="d-flex gap-3 border rounded-4 p-3 mb-4">
                <img
                  src={order.productImage || "https://placehold.co/120x120?text=Order"}
                  alt={order.productName}
                  className="order-card-image"
                />
                <div className="flex-grow-1">
                  <h6 className="mb-2">{order.productName}</h6>
                  <div className="text-muted small mb-3">Seller: {order.sellerId?.shopName || order.sellerId?.name || "Seller"}</div>
                  <div className="row g-3 small">
                    <div className="col-sm-6">
                      <div className="text-muted text-uppercase order-meta-label">Quantity</div>
                      <div className="fw-semibold">{order.quantity}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted text-uppercase order-meta-label">Price</div>
                      <div className="fw-semibold">{formatCurrency(order.subTotal)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted text-uppercase order-meta-label">Delivery Charge</div>
                      <div className="fw-semibold">{formatCurrency(order.deliveryCharge)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted text-uppercase order-meta-label">Total Amount</div>
                      <div className="fw-semibold">{formatCurrency(order.totalAmount)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {order.items?.length > 1 ? (
                <div className="border rounded-4 p-3">
                  <div className="fw-semibold mb-3">All items in this order</div>
                  {order.items.map((item) => (
                    <div key={`${item.productId}-${item.name}`} className="d-flex justify-content-between py-2 border-bottom">
                      <div>{item.name} x {item.quantity}</div>
                      <div>{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">Delivery details</h5>
              <div className="delivery-detail-block mb-3">
                <div className="text-muted small text-uppercase order-meta-label">Customer</div>
                <div className="fw-semibold">{order.customerName}</div>
                <div className="text-muted small">{order.phone || "Phone not shared yet"}</div>
              </div>
              <div className="delivery-detail-block mb-3">
                <div className="text-muted small text-uppercase order-meta-label">Address</div>
                <div className="fw-semibold">{order.address}</div>
              </div>
              <div className="delivery-detail-block mb-4">
                <div className="text-muted small text-uppercase order-meta-label">Payment</div>
                <div className="fw-semibold">{order.paymentMethod} · {order.paymentStatus}</div>
              </div>

              {order.deliveryPartnerId ? (
                <div className="alert alert-light border mb-0">
                  <div className="fw-semibold mb-1">Assigned delivery partner</div>
                  <div>{order.deliveryPartnerId.name}</div>
                  <div className="text-muted small">{order.deliveryPartnerId.phone || "Phone will appear soon"}</div>
                </div>
              ) : (
                <div className="alert alert-warning mb-0">The seller will assign this order to the delivery dashboard after packing.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
