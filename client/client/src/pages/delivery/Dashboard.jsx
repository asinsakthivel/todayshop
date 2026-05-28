import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import useSocket from "../../hooks/useSocket.js";
import NotificationBell from "../../components/NotificationBell.jsx";
import MetricCard from "../../components/MetricCard.jsx";
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

const DeliveryDashboard = () => {
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState({
    notifications: [],
    unreadCount: 0
  });

  const [earnings, setEarnings] = useState({
    totalDeliveries: 0,
    deliveredToday: 0,
    totalDeliveryEarnings: 0
  });

  const load = useCallback(async () => {
    const [
      { data: taskData },
      { data: profileData },
      { data: earningsData }
    ] = await Promise.all([
      api.get("/delivery/tasks"),
      api.get("/delivery/profile"),
      api.get("/delivery/earnings")
    ]);

    const notifications = profileData.notifications || [];

    setTasks(taskData);
    setProfile({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length
    });

    setEarnings(earningsData);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socketClient = socket.current;

    const handler = (payload) => {
      if (payload.type === "DELIVERY_QUEUE_READY") {
        toast.info("A new order is ready for pickup.");
      } else if (payload.status) {
        toast.success(
          `Delivery updated: ${getDeliveryStatusLabel(payload.status)}`
        );
      }

      void load();
    };

    socketClient?.on("orderUpdate", handler);

    return () => socketClient?.off("orderUpdate", handler);
  }, [load, socket]);

  const readyTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          normalizeDeliveryStatus(task.currentStatus) === "READY_FOR_PICKUP"
      ),
    [tasks]
  );

  const activeTasks = useMemo(
    () =>
      tasks.filter((task) =>
        ["PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(
          normalizeDeliveryStatus(task.currentStatus)
        )
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          normalizeDeliveryStatus(task.currentStatus) === "DELIVERED"
      ),
    [tasks]
  );

  return (
    <div className="container py-2">
      <div className="dashboard-hero mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">
            Delivery Dashboard
          </span>
          <h2 className="mb-1">Live pickup and delivery queue</h2>
          <p className="text-muted mb-0">
            Order notifications and completed earnings in one place.
          </p>
        </div>

        <Link to="/delivery/tasks" className="btn btn-dark">
          Open Delivery Queue
        </Link>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Total Deliveries"
            value={earnings.totalDeliveries}
            icon="bi bi-truck"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Delivered Today"
            value={earnings.deliveredToday}
            accent="success"
            icon="bi bi-calendar2-check"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Completed Tasks"
            value={completedTasks.length}
            accent="success"
            icon="bi bi-check-circle"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Ready Pickups"
            value={readyTasks.length}
            accent="warning"
            icon="bi bi-bell"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side */}
        <div className="col-xl-4">
          <NotificationBell
            count={profile.unreadCount}
            title="Pickup Alerts"
            items={profile.notifications}
            emptyMessage="No new pickup notifications yet."
            onMarkRead={() => {
              setProfile((prev) => ({
                ...prev,
                unreadCount: 0
              }));
            }}
          />

          {/* Earnings Section */}
          <div className="card shadow-sm border-0 mt-3">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold">Delivery Earnings</h6>
                <span className="badge text-bg-success">
                  {formatCurrency(
                    earnings.totalDeliveryEarnings
                  )}
                </span>
              </div>

              {completedTasks.length ? (
                completedTasks.slice(0, 4).map((task) => (
                  <div
                    key={task._id}
                    className="dashboard-order-row mb-3 pb-3 border-bottom"
                  >
                    <div>
                      <div className="fw-semibold">
                        {task.orderId?.productName ||
                          task.orderId?.items?.[0]?.name ||
                          "Order item"}
                      </div>
                      <div className="text-muted small">
                        {task.orderId?.customerName ||
                          task.orderId?.buyerId?.name ||
                          "Customer"}
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="badge text-bg-success mb-1">
                        Delivered
                      </span>
                      <div className="fw-semibold">
                        {formatCurrency(
                          task.earnings ||
                            task.orderId?.deliveryCharge ||
                            10
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted small">
                  No completed delivery earnings yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Queue */}
        <div className="col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div>
                  <h5 className="mb-1">Current Queue</h5>
                  <p className="text-muted small mb-0">
                    Active assigned delivery orders.
                  </p>
                </div>

                <span className="badge rounded-pill text-bg-primary">
                  {activeTasks.length} Active
                </span>
              </div>

              {tasks.length ? (
                tasks.slice(0, 6).map((task) => (
                  <div
                    key={task._id}
                    className="dashboard-order-row mb-3 pb-3 border-bottom"
                  >
                    <div>
                      <div className="fw-semibold">
                        Order #{task.orderId?._id || task.orderId}
                      </div>

                      <div className="text-muted small">
                        {task.orderId?.productName ||
                          task.orderId?.items?.[0]?.name ||
                          "Order item"}
                      </div>

                      <div className="text-muted small">
                        {task.orderId?.address ||
                          "Address pending"}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
                      <span
                        className={`badge text-bg-${getDeliveryStatusBadge(
                          task.currentStatus
                        )}`}
                      >
                        {getDeliveryStatusLabel(
                          task.currentStatus
                        )}
                      </span>

                      <div className="fw-semibold">
                        {formatCurrency(
                          task.orderId?.deliveryCharge || 10
                        )}
                      </div>

                      <Link
                        to={`/delivery/tasks/${task._id}`}
                        className="btn btn-outline-dark btn-sm"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted">
                  No delivery tasks yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default DeliveryDashboard;