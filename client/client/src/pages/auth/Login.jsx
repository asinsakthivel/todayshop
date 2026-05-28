import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      toast.success("Logged in successfully");

      const dest =
        data.role === "buyer"
          ? "/buyer"
          : data.role === "seller"
          ? "/seller"
          : data.role === "admin"
          ? "/admin"
          : data.role === "deliveryPartner"
          ? (data.user?.isVerified ? "/delivery/dashboard" : "/delivery/kyc")
          : "/delivery/kyc";

      navigate(dest, { replace: true });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.approvalStatus) {
        navigate("/seller/pending", { replace: true });
      }
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center px-3"
        style={{ background: "#f8f9fa" }}
      >
        <div
          className="card border-0 shadow-lg p-4"
          style={{
            width: "100%",
            maxWidth: "420px",
            borderRadius: "20px",
            backdropFilter: "blur(10px)"
          }}
        >
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-1">Today Shop</h2>
            <p className="text-muted mb-0">Welcome back</p>
          </div>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                className="form-control py-2 px-3"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderRadius: "12px" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <div className="position-relative">
                <input
                  className="form-control py-2 px-3"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderRadius: "12px" }}
                />
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowPass(!showPass)}
                  style={{ border: "none", background: "transparent" }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-end mb-3">
              <Link
                to="/forgot-password"
                className="text-decoration-none text-dark small"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              className="btn btn-dark w-100 py-2 fw-semibold"
              type="submit"
              disabled={loading}
              style={{ borderRadius: "12px" }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="mt-4 text-center text-muted">
              Don't have an account?{" "}
              <Link to="/register" className="fw-semibold text-dark">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </>
  );
};

export default Login;
