import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Auth = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", shopName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err?.response?.data?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-body">
          <h3 className="mb-3 text-center">Today Shop</h3>
          <div className="btn-group w-100 mb-3">
            <button className={`btn ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode("login")}>
              Login
            </button>
            <button className={`btn ${mode === "register" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode("register")}>
              Register
            </button>
          </div>

          <div className="d-grid gap-2 mb-3">
            <div className="text-muted small">Choose your role</div>
            <div className="d-flex gap-2">
              {["user","seller","delivery"].map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`btn flex-fill ${form.role === role ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setForm({ ...form, role })}
                >
                  {role === "user" ? "Buyer" : role === "seller" ? "Seller" : "Delivery"}
                </button>
              ))}
            </div>
          </div>

          <form className="vstack gap-3" onSubmit={submit}>
            {mode === "register" && (
              <input className="form-control" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            )}

            {/* role selection moved to buttons above */}

            {mode === "register" && form.role === "seller" && (
              <input className="form-control" placeholder="Shop Name" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            )}

            <input className="form-control" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="form-control" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

            {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
