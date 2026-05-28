import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Sidebar = ({ className = "", onNavigate = null }) => {
  const { role } = useAuth();

  const linksByRole = {
    buyer: [
      { to: "/buyer", label: "Dashboard", icon: "bi bi-grid-1x2" },
      { to: "/buyer/cart", label: "Cart", icon: "bi bi-bag" },
      { to: "/buyer/orders", label: "Orders", icon: "bi bi-receipt" },
      { to: "/buyer/wishlist", label: "Wishlist", icon: "bi bi-heart" },
      { to: "/buyer/profile", label: "Profile", icon: "bi bi-person" },
      { to: "/buyer/addresses", label: "Addresses", icon: "bi bi-geo-alt" },
    ],
    seller: [
      { to: "/seller", label: "Dashboard", icon: "bi bi-grid-1x2" },
      { to: "/seller/products", label: "Products", icon: "bi bi-box-seam" },
      { to: "/seller/orders", label: "Orders", icon: "bi bi-receipt" },
      { to: "/seller/reviews", label: "Reviews", icon: "bi bi-star" },
      { to: "/seller/profile", label: "Profile", icon: "bi bi-person" },
    ],
    deliveryPartner: [
      { to: "/delivery/kyc", label: "KYC", icon: "bi bi-shield-check" },
      { to: "/delivery/dashboard", label: "Dashboard", icon: "bi bi-grid-1x2" },
      { to: "/delivery/tasks", label: "Tasks", icon: "bi bi-truck" },
      { to: "/delivery/earnings", label: "Earnings", icon: "bi bi-wallet2" },
      { to: "/delivery/profile", label: "Profile", icon: "bi bi-person" },
    ],
    admin: [
      { to: "/admin", label: "Admin Panel", icon: "bi bi-shield-lock" },
    ],
  };

  const links = linksByRole[role] || [];
  if (!links.length) return null;

  return (
    <div className={`card app-sidebar p-3 ${className}`}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="text-uppercase small text-muted fw-semibold">Workspace</div>
        <span className="workspace-meta">Links</span>
      </div>
      <div className="list-group list-group-flush">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              `list-group-item list-group-item-action sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <i className={`${link.icon} me-2`} />
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
