import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

const Deliveries = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const path = user.role === "admin" ? "/admin/delivery-apps" : "/delivery/me";
    api.get(path).then(({ data }) => setItems(data)).catch(() => setItems([]));
  }, [user]);

  return (
    <div className="card">
      <h5>Deliveries / Applications</h5>
      <ul className="list-group list-group-flush mt-3">
        {items.map((d) => (
          <li key={d._id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">{d.name || d.applicant?.name || "Applicant"}</div>
              <div className="text-muted small">{d.status}</div>
            </div>
            <span className="badge text-bg-secondary text-uppercase">{d.status}</span>
          </li>
        ))}
        {items.length === 0 && <li className="list-group-item text-muted">No items</li>}
      </ul>
    </div>
  );
};
export default Deliveries;
