import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import useSocket from "../../hooks/useSocket.js";
import { getDeliveryStatusBadge, getDeliveryStatusLabel, normalizeDeliveryStatus } from "../../lib/deliveryStatus.js";
import "react-toastify/dist/ReactToastify.css";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [busyId, setBusyId] = useState("");
  const socket = useSocket();

  const load = useCallback(async () => {
    const { data } = await api.get("/delivery/tasks");
    setTasks(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socketClient = socket.current;
    const handler = () => {
      void load();
    };
    socketClient?.on("orderUpdate", handler);
    return () => socketClient?.off("orderUpdate", handler);
  }, [load, socket]);

  const acceptPickup = async (taskId) => {
    try {
      setBusyId(taskId);
      await api.put(`/delivery/tasks/${taskId}/accept`);
      toast.success("Pickup accepted.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not accept pickup");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="container py-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <span className="badge text-bg-dark mb-2">Delivery Queue</span>
          <h3 className="mb-1">Assigned and ready orders</h3>
          <p className="text-muted mb-0">Every ready pickup arrives here automatically after the seller assigns it.</p>
        </div>
        <span className="badge rounded-pill text-bg-primary px-3 py-2">{tasks.length} total tasks</span>
      </div>

      {tasks.length ? tasks.map((task) => {
        const order = task.orderId || {};
        const currentStatus = normalizeDeliveryStatus(task.currentStatus);
        const canAccept = currentStatus === "READY_FOR_PICKUP";

        return (
          <div key={task._id} className="card shadow-sm border-0 order-management-card mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-xl-row justify-content-between gap-4">
                <div className="d-flex gap-3 flex-grow-1">
                  <img
                    src={order.productImage || order.items?.[0]?.image || "https://placehold.co/120x120?text=Order"}
                    alt={order.productName || order.items?.[0]?.name || "Order"}
                    className="order-card-image"
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className={`badge text-bg-${getDeliveryStatusBadge(task.currentStatus)}`}>{getDeliveryStatusLabel(task.currentStatus)}</span>
                      <span className="text-muted small">Order #{order._id || task.orderId}</span>
                    </div>
                    <h5 className="mb-1">{order.productName || order.items?.[0]?.name || "Order item"}</h5>
                    <div className="text-muted small mb-3">{order.customerName || order.buyerId?.name || "Customer"}</div>

                    <div className="row g-3 small">
                      <div className="col-sm-6 col-lg-4">
                        <div className="text-muted text-uppercase order-meta-label">Phone Number</div>
                        <div className="fw-semibold">{order.phone || order.buyerId?.phone || "Not available"}</div>
                      </div>
                      <div className="col-sm-6 col-lg-4">
                        <div className="text-muted text-uppercase order-meta-label">Delivery Charge</div>
                        <div className="fw-semibold">{formatCurrency(order.deliveryCharge || 10)}</div>
                      </div>
                      <div className="col-sm-6 col-lg-4">
                        <div className="text-muted text-uppercase order-meta-label">Order Status</div>
                        <div className="fw-semibold">{getDeliveryStatusLabel(task.currentStatus)}</div>
                      </div>
                    </div>

                    <div className="border rounded-4 p-3 mt-3 small">
                      <div className="text-muted text-uppercase order-meta-label mb-1">Customer Address</div>
                      <div className="fw-semibold">{order.address || task.dropAddress || "Address pending"}</div>
                    </div>
                  </div>
                </div>

                <div className="order-card-sidepanel">
                  {canAccept ? (
                    <button
                      className="btn btn-dark w-100 mb-2"
                      disabled={busyId === task._id}
                      onClick={() => acceptPickup(task._id)}
                    >
                      {busyId === task._id ? "Accepting..." : "Accept Pickup"}
                    </button>
                  ) : null}
                  <Link className="btn btn-outline-dark w-100" to={`/delivery/tasks/${task._id}`}>Manage Task</Link>
                </div>
              </div>
            </div>
          </div>
        );
      }) : (
        <div className="card shadow-sm border-0">
          <div className="card-body p-5 text-center text-muted">No delivery tasks assigned yet.</div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Tasks;
