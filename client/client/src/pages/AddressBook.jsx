import { useEffect, useState } from "react";
import api from "../lib/api";

const emptyForm = { fullName: "", phone: "", line: "", city: "", state: "", pincode: "", isDefault: false };

const AddressBook = () => {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/address").then(({ data }) => setAddresses(data)).catch(() => setAddresses([]));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/address", form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save address");
    }
  };

  const makeDefault = async (id) => {
    await api.patch(`/address/${id}`, { isDefault: true });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/address/${id}`);
    load();
  };

  return (
    <div className="card">
      <h5>Address book</h5>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <form className="row g-2 mb-3" onSubmit={submit}>
        {["fullName","phone","line","city","state","pincode"].map((field) => (
          <div key={field} className="col-md-6">
            <input
              className="form-control"
              placeholder={field.replace(/([A-Z])/g, " $1")}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
            />
          </div>
        ))}
        <div className="col-12 form-check ms-2">
          <input className="form-check-input" type="checkbox" id="defaultAddr" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          <label className="form-check-label" htmlFor="defaultAddr">Set as default</label>
        </div>
        <div className="col-12">
          <button className="btn btn-primary btn-sm" type="submit">Save address</button>
        </div>
      </form>

      <div className="list-group">
        {addresses.map((a) => (
          <div key={a._id} className="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <div className="fw-semibold">{a.fullName} {a.isDefault ? <span className="badge text-bg-success">Default</span> : null}</div>
              <div className="text-muted small">{a.phone}</div>
              <div>{a.line}</div>
              <div>{a.city}, {a.state} - {a.pincode}</div>
            </div>
            <div className="d-flex gap-2">
              {!a.isDefault ? <button className="btn btn-outline-primary btn-sm" onClick={() => makeDefault(a._id)}>Make default</button> : null}
              <button className="btn btn-outline-danger btn-sm" onClick={() => remove(a._id)}>Delete</button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && <p className="text-muted">No addresses yet.</p>}
      </div>
    </div>
  );
};

export default AddressBook;
