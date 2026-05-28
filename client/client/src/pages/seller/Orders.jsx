import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import useSocket from "../../hooks/useSocket.js";
import NotificationBell from "../../components/NotificationBell.jsx";
import {
  getDeliveryStatusBadge,
  getDeliveryStatusLabel,
  normalizeDeliveryStatus
} from "../../lib/deliveryStatus.js";
import "react-toastify/dist/ReactToastify.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const statusActions = {
  placed: { label: "Accept Order", endpoint: "accept" },
  accepted: { label: "Mark as Packed", endpoint: "pack" },
  packed: { label: "Assign to Delivery Partner", endpoint: "assign" }
};

const Orders = () => {
  const socket = useSocket();

  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    unreadNotifications: 0,
    notifications: [],
    pendingOrders: 0
  });

  const [busyOrderId, setBusyOrderId] = useState("");

  const load = useCallback(async () => {
    const [{ data: ordersData }, { data: analyticsData }] =
      await Promise.all([
        api.get("/seller/orders"),
        api.get("/seller/analytics")
      ]);

    setOrders((ordersData || []).filter((o) => o.adminApproved));

    setAnalytics({
      unreadNotifications:
        analyticsData.unreadNotifications || 0,
      notifications: analyticsData.notifications || [],
      pendingOrders: analyticsData.pendingOrders || 0
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socketClient = socket.current;

    const handler = (payload) => {
      if (payload.type === "NEW_ORDER_RECEIVED") {
        // Only react to orders that were approved by admin
        if (payload.order?.adminApproved) {
          toast.info("New Order Received");
          void load();
        }
        return;
      }

      void load();
    };

    socketClient?.on("orderUpdate", handler);

    return () =>
      socketClient?.off("orderUpdate", handler);
  }, [load, socket]);

  const runAction = async (orderId, endpoint) => {
    try {
      setBusyOrderId(orderId);

      await api.put(`/seller/order/${orderId}/${endpoint}`);

      toast.success("Order updated successfully.");
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not update order"
      );
    } finally {
      setBusyOrderId("");
    }
  };

  const clearNotifications = async () => {
    try {
      await api.put("/notifications/mark-read");

      setAnalytics((prev) => ({
        ...prev,
        unreadNotifications: 0,
        notifications: []
      }));

      toast.success("All notifications cleared");
    } catch {
      toast.error("Could not clear notifications");
    }
  };

  return (
    <div className="container py-2">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">
            Seller Orders
          </span>
          <h3 className="mb-1">
            Incoming and active orders
          </h3>
          <p className="text-muted mb-0">
            Accept, pack, and assign delivery
            orders.
          </p>
        </div>

        <div className="order-summary-chip">
          <div className="small text-muted">
            Pending Orders
          </div>
          <div className="fw-semibold">
            {analytics.pendingOrders}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="row g-4 mb-4">
        <div className="col-xl-4">
          <NotificationBell
            count={analytics.unreadNotifications}
            title="Notification Bell"
            items={analytics.notifications}
            emptyMessage="No new notifications. New buyer orders will appear here."
            onMarkRead={clearNotifications}
          />
        </div>

        <div className="col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h5 className="mb-1">
                    Order Count
                  </h5>
                  <p className="text-muted small mb-0">
                    Updates in real time.
                  </p>
                </div>

                <span className="badge rounded-pill text-bg-primary px-3 py-2">
                  {analytics.pendingOrders} Live Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length ? (
        <div className="row g-4">
          {orders.map((order) => {
            const currentStatus =
              normalizeDeliveryStatus(
                order.orderStatus
              );

            const action =
              statusActions[currentStatus];

            return (
              <div
                className="col-12"
                key={order._id}
              >
                <div className="card shadow-sm border-0 order-management-card">
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-xl-row justify-content-between gap-4">
                      <div className="d-flex gap-3 flex-grow-1">
                        <img
                          src={
                            order.productImage ||
                            "https://placehold.co/120x120?text=Order"
                          }
                          alt={order.productName}
                          className="order-card-image"
                        />

                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <span
                              className={`badge text-bg-${getDeliveryStatusBadge(
                                order.orderStatus
                              )}`}
                            >
                              {getDeliveryStatusLabel(
                                order.orderStatus
                              )}
                            </span>

                            <span className="text-muted small">
                              Order #{order._id}
                            </span>
                          </div>

                          <h5 className="mb-1">
                            {order.productName}
                          </h5>

                          <div className="text-muted small mb-3">
                            Order Date:{" "}
                            {new Date(
                              order.orderDate ||
                                order.createdAt
                            ).toLocaleString()}
                          </div>

                          <div className="row g-3 small">
                            <div className="col-sm-6 col-lg-4">
                              <div className="text-muted text-uppercase">
                                Product Price
                              </div>
                              <div className="fw-semibold">
                                {formatCurrency(
                                  order.subTotal
                                )}
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-4">
                              <div className="text-muted text-uppercase">
                                Quantity
                              </div>
                              <div className="fw-semibold">
                                {order.quantity}
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-4">
                              <div className="text-muted text-uppercase">
                                Customer
                              </div>
                              <div className="fw-semibold">
                                {order.customerName}
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-4 p-3 mt-3 small">
                            <div className="text-muted text-uppercase mb-1">
                              Address
                            </div>
                            <div className="fw-semibold">
                              {order.address}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="order-card-sidepanel">
                        <div className="small text-muted mb-1">
                          Order Status
                        </div>

                        <div className="fw-semibold mb-3">
                          {getDeliveryStatusLabel(
                            order.orderStatus
                          )}
                        </div>

                        {action ? (
                          <button
                            className="btn btn-dark w-100 mb-2"
                            disabled={
                              busyOrderId ===
                              order._id
                            }
                            onClick={() =>
                              runAction(
                                order._id,
                                action.endpoint
                              )
                            }
                          >
                            {busyOrderId ===
                            order._id
                              ? "Updating..."
                              : action.label}
                          </button>
                        ) : null}

                        <Link
                          to={`/seller/orders/${order._id}`}
                          className="btn btn-outline-dark w-100"
                        >
                          Open Order
                        </Link>
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
          <div className="card-body p-5 text-center text-muted">
            No new orders yet.
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Orders;