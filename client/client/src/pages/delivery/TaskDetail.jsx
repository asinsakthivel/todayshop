import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../../api/axios.js";
import OrderTimeline from "../../components/OrderTimeline.jsx";
import { getDeliveryStatusBadge, getDeliveryStatusLabel, normalizeDeliveryStatus } from "../../lib/deliveryStatus.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const TaskDetail = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/delivery/tasks");
    setTask(data.find((item) => item._id === id) || null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const normalizedStatus = useMemo(() => normalizeDeliveryStatus(task?.currentStatus), [task?.currentStatus]);
  const orderId = task?.orderId?._id || task?.orderId;

  const action = useMemo(() => {
    switch (normalizedStatus) {
      case "READY_FOR_PICKUP":
        return { label: "Accept Pickup", run: () => api.put(`/delivery/tasks/${id}/accept`) };
      case "PICKUP_ASSIGNED":
        return { label: "Picked Up", run: () => api.put(`/delivery/order/${orderId}/pickup`) };
      case "PICKED_UP":
        return { label: "Out for Delivery", run: () => api.put(`/delivery/order/${orderId}/out-for-delivery`) };
      case "OUT_FOR_DELIVERY":
        return { label: "Delivered", run: () => api.put(`/delivery/order/${orderId}/delivered`) };
      default:
        return null;
    }
  }, [id, normalizedStatus, orderId]);

  const runAction = async () => {
    if (!action) return;
    try {
      setSaving(true);
      await action.run();
      toast.success("Delivery updated successfully.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update delivery");
    } finally {
      setSaving(false);
    }
  };

  if (!task) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="mb-1">Delivery task #{task._id}</h4>
          <p className="text-muted mb-0">Move the order from pickup through doorstep delivery.</p>
        </div>
        <span className={`badge text-bg-${getDeliveryStatusBadge(task.currentStatus)}`}>{getDeliveryStatusLabel(task.currentStatus)}</span>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">Status timeline</h5>
          <OrderTimeline status={task.orderId?.orderStatus || task.currentStatus} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex gap-3 mb-4">
                <img
                  src={task.orderId?.productImage || task.orderId?.items?.[0]?.image || "https://placehold.co/120x120?text=Order"}
                  alt={task.orderId?.productName || task.orderId?.items?.[0]?.name || "Order"}
                  className="order-card-image"
                />
                <div>
                  <h5 className="mb-2">{task.orderId?.productName || task.orderId?.items?.[0]?.name || "Order item"}</h5>
                  <div className="text-muted small">Customer: {task.orderId?.customerName || task.orderId?.buyerId?.name || "Customer"}</div>
                  <div className="text-muted small">Phone: {task.orderId?.phone || task.orderId?.buyerId?.phone || "Not available"}</div>
                  <div className="text-muted small">Delivery Charge: {formatCurrency(task.orderId?.deliveryCharge || 10)}</div>
                </div>
              </div>

              <div className="border rounded-4 p-3 mb-4">
                <div className="text-muted text-uppercase order-meta-label mb-1">Customer Address</div>
                <div className="fw-semibold">{task.orderId?.address || task.dropAddress || "Address pending"}</div>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2">
                {action ? (
                  <button className="btn btn-dark" disabled={saving} onClick={runAction}>
                    {saving ? "Updating..." : action.label}
                  </button>
                ) : null}
                {normalizedStatus === "READY_FOR_PICKUP" ? (
                  <button
                    className="btn btn-outline-danger"
                    disabled={saving}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        await api.put(`/delivery/tasks/${id}/reject`);
                        toast.success("Task returned to the pickup queue.");
                        await load();
                      } catch (error) {
                        toast.error(error.response?.data?.message || "Could not reject task");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Reject Task
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">Status history</h5>
              {task.statusHistory?.length ? task.statusHistory.slice().reverse().map((entry, index) => (
                <div key={`${entry.status}-${index}`} className="border rounded-4 p-3 mb-2">
                  <div className="fw-semibold">{getDeliveryStatusLabel(entry.status)}</div>
                  <div className="text-muted small">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Just now"}</div>
                </div>
              )) : (
                <div className="text-muted">No updates yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default TaskDetail;
