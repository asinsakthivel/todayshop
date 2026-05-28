import { useEffect, useState } from "react";
import api from "../../api/axios.js";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});

  const syncForm = (data) => {
    setForm({
      name: data.name || "",
      shopName: data.shopName || "",
      phone: data.phone || "",
      email: data.email || "",
    });
  };

  useEffect(() => {
    api.get("/seller/profile").then(({ data }) => {
      setUser(data);
      syncForm(data);
    });
  }, []);

  const save = async () => {
    const { data } = await api.put("/seller/profile", {
      name: form.name,
      shopName: form.shopName,
      phone: form.phone,
    });
    setUser(data);
    syncForm(data);
  };

  if (!user) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h4 className="mb-3">Seller Profile</h4>
      <div className="card card-body border-0 mb-4">
        <div className="row g-3">
          <div className="col-12">
            <strong className="d-block mb-1">Saved profile</strong>
            <div className="text-muted">This information is loaded from your account and updated when you save.</div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Name</div>
              <div>{user.name || "—"}</div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Shop Name</div>
              <div>{user.shopName || "—"}</div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Phone</div>
              <div>{user.phone || "—"}</div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="border rounded-3 p-3 bg-white">
              <div className="text-uppercase small text-muted mb-2">Email</div>
              <div>{user.email || "—"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card card-body shadow-sm">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Shop Name</label>
          <input className="form-control" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" value={form.email} disabled readOnly />
        </div>
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
};

export default Profile;
