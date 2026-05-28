import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import MetricCard from "../../components/MetricCard.jsx";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Earnings = () => {
  const [data, setData] = useState({
    totalDeliveries: 0,
    deliveredToday: 0,
    totalDeliveryEarnings: 0,
    completedDeliveries: []
  });

  useEffect(() => {
    api.get("/delivery/earnings").then(({ data: earnings }) => setData(earnings));
  }, []);

  return (
    <div className="container py-2">
      <div className="mb-4">
        <span className="badge text-bg-dark mb-2">Delivery Earnings</span>
        <h3 className="mb-1">Completed delivery payouts</h3>
        <p className="text-muted mb-0">Every delivered order adds the ₹10 delivery charge to your earnings summary.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <MetricCard label="Total Deliveries" value={data.totalDeliveries} icon="bi bi-truck" />
        </div>
        <div className="col-md-4">
          <MetricCard label="Delivered Today" value={data.deliveredToday} accent="success" icon="bi bi-calendar2-check" />
        </div>
        <div className="col-md-4">
          <MetricCard label="Total Delivery Earnings" value={formatCurrency(data.totalDeliveryEarnings)} accent="dark" icon="bi bi-wallet2" />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h5 className="mb-3">Completed deliveries</h5>
          {data.completedDeliveries?.length ? data.completedDeliveries.map((task) => (
            <div key={task._id} className="dashboard-order-row">
              <div>
                <div className="fw-semibold">{task.order?.productName || task.orderId?.productName || "Order item"}</div>
                <div className="text-muted small">{task.order?.customerName || task.orderId?.customerName || "Customer"}</div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="badge text-bg-success">Delivered</span>
                <div className="fw-semibold">{formatCurrency(task.earnings || 10)}</div>
              </div>
            </div>
          )) : (
            <div className="text-muted">Completed deliveries will appear here after you mark orders as delivered.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;
