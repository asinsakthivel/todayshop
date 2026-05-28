import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useCart from "../hooks/useCart.js";
import { hasDeliveryKyc } from "../lib/deliveryKyc.js";

const Navbar = ({ onWorkspaceToggle = null }) => {
  const { user, logout, role } = useAuth();
  const { cart, fetchCart } = useCart({ enabled: role === "buyer" });
  const [cartCount, setCartCount ] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const buyerQuery = role === "buyer" || !role ? searchParams.get("q") || "" : "";
  const deliveryHome = hasDeliveryKyc(user?.id || user?._id) ? "/delivery/dashboard" : "/delivery/kyc";
  const home = role === "buyer" ? "/buyer" : role === "seller" ? "/seller" : role === "deliveryPartner" ? deliveryHome : role === "admin" ? "/admin" : "/products";

  // Update cart count whenever cart changes
  useEffect(() => {
    setCartCount(cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0);
  }, [cart]);

  // Listen for cart updates from other components
  useEffect(() => {
    if (role !== "buyer") return;
    
    const handleCartUpdate = (event) => {
      if (event?.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      }
      fetchCart();
    };

    // Listen for custom cart update events
    window.addEventListener("cartUpdated", handleCartUpdate);
    
    // Also poll for cart updates every few seconds as a fallback
    const pollInterval = setInterval(() => {
      fetchCart();
    }, 3000);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(pollInterval);
    };
  }, [role, fetchCart]);

  const onSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = String(formData.get("navbarSearch") || "").trim();
    if (!query) return;
    if (role === "buyer") navigate(`/products?q=${encodeURIComponent(query)}`);
    if (role === "seller") navigate("/seller/products");
    if (role === "deliveryPartner") navigate("/delivery/tasks");
    if (role === "admin") navigate("/admin");
    if (!role) navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container-fluid px-4 px-lg-5">
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <button className="btn btn-outline-secondary workspace-trigger" type="button" onClick={onWorkspaceToggle} aria-label="Open workspace">
              <i className="bi bi-three-dots" />
            </button>
          ) : null}
          <Link className="navbar-brand fw-semibold fs-4 mb-0 d-inline-flex align-items-center gap-2" to={home}>
            <img
              src="/groceries-svgrepo-com.svg"
              alt="Today Shop logo"
              className="navbar-brand-logo"
            />
            <span>Today Shop</span>
          </Link>
        </div>
        <button
          className="navbar-toggler d-lg-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <form key={`${role}-${location.search}`} className="flex-grow-1 mx-auto my-2 my-lg-0 ms-lg-4 w-100 order-lg-0" onSubmit={onSearch}>
            <div className="input-group nav-search-shell">
              <span className="input-group-text bg-white border-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                className="form-control border-0"
                name="navbarSearch"
                defaultValue={buyerQuery}
                placeholder={role === "buyer" || !role ? "Search vegetables, fruits, dairy..." : "Search your workspace"}
              />
              <button className="btn btn-dark px-3" type="submit">Search</button>
            </div>
          </form>
          <div className="d-flex align-items-center gap-2 ms-auto">
            {role === "buyer" ? (
              <button
                className="btn btn-outline-secondary position-relative nav-cart-button"
                onClick={() => navigate("/buyer/cart")}
              >
                <i className="bi bi-bag fs-5" />
                {cartCount > 0 && (
                  <span className="cart-count-badge">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : null}
            
            {user ? (
              <>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    const profilePath = role === "buyer" ? "/buyer/profile" : role === "seller" ? "/seller/profile" : role === "deliveryPartner" ? "/delivery/profile" : role === "admin" ? "/admin" : "/";
                    navigate(profilePath);
                  }}
                >
                  <i className="bi bi-person-circle" />
                </button>
                <button className="btn btn-outline-secondary" onClick={logout}>
                  <i className="bi bi-box-arrow-right" />
                </button>
              </>
            ) : (
              <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/login">
                <i className="bi bi-person-circle" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
