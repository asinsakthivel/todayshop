import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [form, setForm] = useState({ name: "", shopName: "", phone: "", email: "", password: "", role: "buyer" });
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(form);
      toast.success(data.message || "Registered");
      const dest = data.requiresApproval
        ? "/seller/pending"
        : form.role === "buyer"
          ? "/buyer"
          : form.role === "seller"
            ? "/seller"
            : "/delivery/kyc";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <h2 className="mb-4 text-center">Create Account</h2>
      <form className="card card-body shadow-sm" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Name</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="col-12">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          {form.role === "seller" || form.role === "deliveryPartner" ? (
            <div className="col-12">
              <label className="form-label">Mobile Number</label>
              <input
                className="form-control"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter mobile number"
                required
              />
            </div>
          ) : null}
          <div className="col-12">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="col-12">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="deliveryPartner">Delivery Partner</option>
            </select>
          </div>
          {form.role === "seller" ? (
            <div className="col-12">
              <label className="form-label">Shop Name</label>
              <input className="form-control" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
            </div>
          ) : null}
        </div>
        <button className="btn btn-primary w-100 mt-3" type="submit">Register</button>
        <p className="mt-3 text-center">Have an account? <Link to="/login">Login</Link></p>
      </form>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Register;
