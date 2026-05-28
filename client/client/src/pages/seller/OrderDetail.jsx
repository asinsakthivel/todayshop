import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import OrderTimeline from "../../components/OrderTimeline.jsx";
import useSocket from "../../hooks/useSocket.js";
import { getDeliveryStatusBadge, getDeliveryStatusLabel, normalizeDeliveryStatus } from "../../lib/deliveryStatus.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const nextActionByStatus = {
  placed: { label: "Accept Order", endpoint: "accept" },
  accepted: { label: "Mark as Packed", endpoint: "pack" },
  packed: { label: "Assign to Delivery Partner", endpoint: "assign" }
};

const SellerOrderDetail = () => {
  const { id } = useParams();
  const socket = useSocket();
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const currentStatus = useMemo(() => normalizeDeliveryStatus(order?.orderStatus), [order?.orderStatus]);
  const action = nextActionByStatus[currentStatus];

  const runAction = async () => {
    if (!action) return;
    try {
      setSaving(true);
      await api.put(`/seller/order/${id}/${action.endpoint}`);
      toast.success("Order updated successfully.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update order");
    } finally {
      setSaving(false);
    }
  };

  if (!order) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="mb-1">{order.productName}</h4>
          <p className="text-muted mb-0">Seller control for order #{order._id}</p>
        </div>
        <span className={`badge text-bg-${getDeliveryStatusBadge(order.orderStatus)}`}>{getDeliveryStatusLabel(order.orderStatus)}</span>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h5 className="mb-0">Order timeline</h5>
            <span className="badge text-bg-secondary">{formatCurrency(order.totalAmount)}</span>
          </div>
          <OrderTimeline status={order.orderStatus} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex gap-3 mb-4">
                <img
                  src={order.productImage || "https://placehold.co/120x120?text=Order"}
                  alt={order.productName}
                  className="order-card-image"
                />
                <div>
                  <h5 className="mb-2">{order.productName}</h5>
                  <div className="text-muted small">Customer: {order.customerName}</div>
                  <div className="text-muted small">Phone: {order.phone || "Not available"}</div>
                  <div className="text-muted small">Address: {order.address}</div>
                </div>
              </div>

              <div className="row g-3 small">
                <div className="col-sm-6 col-lg-3">
                  <div className="text-muted text-uppercase order-meta-label">Quantity</div>
                  <div className="fw-semibold">{order.quantity}</div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="text-muted text-uppercase order-meta-label">Product Price</div>
                  <div className="fw-semibold">{formatCurrency(order.subTotal)}</div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="text-muted text-uppercase order-meta-label">Delivery Charge</div>
                  <div className="fw-semibold">{formatCurrency(order.deliveryCharge)}</div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="text-muted text-uppercase order-meta-label">Payment Status</div>
                  <div className="fw-semibold text-capitalize">{order.paymentStatus}</div>
                </div>
              </div>

              {order.deliveryPartnerId ? (
                <div className="alert alert-light border mt-4 mb-0">
                  <div className="fw-semibold mb-1">Assigned delivery partner</div>
                  <div>{order.deliveryPartnerId.name}</div>
                  <div className="text-muted small">{order.deliveryPartnerId.phone || "Phone not available"}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">Seller actions</h5>
              {action ? (
                <>
                  <button className="btn btn-dark w-100 mb-3" disabled={saving} onClick={runAction}>
                    {saving ? "Updating..." : action.label}
                  </button>
                  <div className="alert alert-info mb-0">Once you assign the order, it appears in the delivery dashboard for pickup handling.</div>
                </>
              ) : (
                <div className="alert alert-success mb-0">This order is now being handled by the delivery workflow. Progress updates will appear here automatically.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default SellerOrderDetail;
