import { useEffect, useState } from "react";
import api from "../../../api/axios.js";
import AddressCard from "../../../components/AddressCard.jsx";

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ label: "Home", street: "", city: "", state: "", pincode: "", isDefault: false });

  useEffect(() => {
    let alive = true;

    const fetchAddresses = async () => {
      const { data } = await api.get("/buyer/addresses");
      if (alive) setAddresses(data);
    };

    fetchAddresses();
    return () => {
      alive = false;
    };
  }, []);

  const load = async () => {
    const { data } = await api.get("/buyer/addresses");
    setAddresses(data);
  };

  const save = async (e) => {
    e.preventDefault();
    await api.post("/buyer/addresses", form);
    setForm({ label: "Home", street: "", city: "", state: "", pincode: "", isDefault: false });
    load();
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <p className="text-muted text-uppercase small mb-1">Addresses</p>
        <h4 className="mb-0">Manage delivery locations</h4>
      </div>
      <div className="row g-4">
        <div className="col-md-7">
          {addresses.length ? (
            addresses.map((addr) => <AddressCard key={addr._id} address={addr} />)
          ) : (
            <div className="card empty-state-card">
              <div className="card-body p-4">
                <h3 className="h6 mb-2">No addresses saved</h3>
                <p className="text-muted mb-0">Add your first delivery address using the form on the right.</p>
              </div>
            </div>
          )}
        </div>
        <div className="col-md-5">
          <form className="card card-body shadow-sm" onSubmit={save}>
            <h6 className="mb-3">Add New</h6>
            {"label street city state pincode".split(" ").map((field) => (
              <div className="mb-2" key={field}>
                <label className="form-label text-capitalize">{field}</label>
                <input className="form-control" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
              </div>
            ))}
            <div className="form-check mb-2">
              <input className="form-check-input" type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} id="defaultCheck" />
              <label className="form-check-label" htmlFor="defaultCheck">Set as default</label>
            </div>
            <button className="btn btn-primary" type="submit">
              <i className="bi bi-plus-lg me-2" />
              Save address
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Addresses;
