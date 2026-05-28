import { useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import BuyerDashboard from "./pages/auth/buyer/Dashboard.jsx";
import BuyerProducts from "./pages/auth/buyer/Products.jsx";
import ProductDetail from "./pages/auth/buyer/ProductDetail.jsx";
import BuyerCart from "./pages/auth/buyer/Cart.jsx";
import BuyerCheckout from "./pages/auth/buyer/Checkout.jsx";
import BuyerOrders from "./pages/auth/buyer/Orders.jsx";
import OrderDetail from "./pages/auth/buyer/OrderDetail.jsx";
import Wishlist from "./pages/auth/buyer/Wishlist.jsx";
import ProfileBuyer from "./pages/auth/buyer/Profile.jsx";
import Addresses from "./pages/auth/buyer/Addresses.jsx";
import SellerDashboard from "./pages/seller/Dashboard.jsx";
import SellerProducts from "./pages/seller/Products.jsx";
import SellerAdd from "./pages/seller/AddProduct.jsx";
import SellerEdit from "./pages/seller/EditProduct.jsx";
import SellerOrders from "./pages/seller/Orders.jsx";
import SellerOrderDetail from "./pages/seller/OrderDetail.jsx";
import SellerReviews from "./pages/seller/Reviews.jsx";
import SellerProfile from "./pages/seller/Profile.jsx";
import DeliveryDashboard from "./pages/delivery/Dashboard.jsx";
import DeliveryKyc from "./pages/delivery/Kyc.jsx";
import DeliveryTasks from "./pages/delivery/Tasks.jsx";
import DeliveryTaskDetail from "./pages/delivery/TaskDetail.jsx";
import DeliveryEarnings from "./pages/delivery/Earnings.jsx";
import DeliveryProfile from "./pages/delivery/Profile.jsx";
import DashboardAdmin from "./pages/DashboardAdmin.jsx";
import SellerApprovalPending from "./pages/SellerApprovalPending.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import BuyerCategorySubnav from "./components/BuyerCategorySubnav.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { hasDeliveryKyc } from "./lib/deliveryKyc.js";


const Layout = ({ children, subnav = null, fullWidth = false }) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const { role } = useAuth();

  return (
    <div className={`bg-light min-vh-100 app-layout ${subnav ? "has-subnav" : ""}`}>
      <Navbar onWorkspaceToggle={() => setWorkspaceOpen((current) => !current)} />
      {subnav}
      <div className={`workspace-overlay ${workspaceOpen ? "open" : ""}`} onClick={() => setWorkspaceOpen(false)} />
      <aside className={`workspace-drawer ${workspaceOpen ? "open" : ""}`} aria-hidden={!workspaceOpen}>
        <Sidebar className="workspace-sidebar-shell" onNavigate={() => setWorkspaceOpen(false)} />
      </aside>
      <main className="main-content">
        <div className={`container-fluid px-2 px-md-4 px-lg-5 pt-3 pb-4 app-page-shell ${fullWidth ? "full-width" : ""}`}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  const { role, user } = useAuth();
  const userId = user?.id || user?._id;
  const sellerHome = role === "seller" && user?.approvalStatus !== "approved" ? "/seller/pending" : "/seller";
  const deliveryHome = useMemo(
    () => (user?.isVerified || hasDeliveryKyc(userId) ? "/delivery/dashboard" : "/delivery/kyc"),
    [user?.isVerified, userId]
  );
  const roleRedirect = role === "buyer"
    ? "/buyer"
    : role === "seller"
      ? sellerHome
      : role === "deliveryPartner"
        ? deliveryHome
        : role === "admin"
          ? "/admin"
          : null;

  return (
    <Routes>
      <Route path="/" element={roleRedirect ? <Navigate to={roleRedirect} replace /> : <Navigate to="/products" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/seller/pending" element={<Layout><SellerApprovalPending /></Layout>} />

      {/* Buyer */}
      <Route path="/buyer" element={
        <ProtectedRoute roles={["buyer"]}>
          <Layout subnav={<BuyerCategorySubnav />}>
            <BuyerDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/products" element={
        <Layout subnav={<BuyerCategorySubnav />}>
          <BuyerProducts />
        </Layout>
      } />

      <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/buyer/cart" element={<ProtectedRoute roles={["buyer"]}><Layout><BuyerCart /></Layout></ProtectedRoute>} />
      <Route path="/buyer/checkout" element={<ProtectedRoute roles={["buyer"]}><Layout><BuyerCheckout /></Layout></ProtectedRoute>} />
      <Route path="/buyer/orders" element={<ProtectedRoute roles={["buyer"]}><Layout><BuyerOrders /></Layout></ProtectedRoute>} />
      <Route path="/buyer/orders/:id" element={<ProtectedRoute roles={["buyer"]}><Layout><OrderDetail /></Layout></ProtectedRoute>} />
      <Route path="/buyer/wishlist" element={<ProtectedRoute roles={["buyer"]}><Layout><Wishlist /></Layout></ProtectedRoute>} />
      <Route path="/buyer/profile" element={<ProtectedRoute roles={["buyer"]}><Layout><ProfileBuyer /></Layout></ProtectedRoute>} />
      <Route path="/buyer/addresses" element={<ProtectedRoute roles={["buyer"]}><Layout><Addresses /></Layout></ProtectedRoute>} />
      {/* Seller */}
      <Route path="/seller" element={<ProtectedRoute roles={["seller"]}><Layout><SellerDashboard /></Layout></ProtectedRoute>} />
      <Route path="/seller/products" element={<ProtectedRoute roles={["seller"]}><Layout><SellerProducts /></Layout></ProtectedRoute>} />
      <Route path="/seller/products/add" element={<ProtectedRoute roles={["seller"]}><Layout><SellerAdd /></Layout></ProtectedRoute>} />
      <Route path="/seller/products/:id" element={<ProtectedRoute roles={["seller"]}><Layout><SellerEdit /></Layout></ProtectedRoute>} />
      <Route path="/seller/orders" element={<ProtectedRoute roles={["seller"]}><Layout><SellerOrders /></Layout></ProtectedRoute>} />
      <Route path="/seller/orders/:id" element={<ProtectedRoute roles={["seller"]}><Layout><SellerOrderDetail /></Layout></ProtectedRoute>} />
      <Route path="/seller/reviews" element={<ProtectedRoute roles={["seller"]}><Layout><SellerReviews /></Layout></ProtectedRoute>} />
      <Route path="/seller/profile" element={<ProtectedRoute roles={["seller"]}><Layout><SellerProfile /></Layout></ProtectedRoute>} />
    
      {/* Delivery */}
      <Route path="/delivery" element={<ProtectedRoute roles={["deliveryPartner"]}><Navigate to={deliveryHome} replace /></ProtectedRoute>} />
      <Route path="/delivery/kyc" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryKyc /></Layout></ProtectedRoute>} />
      <Route path="/delivery/dashboard" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryDashboard /></Layout></ProtectedRoute>} />
      <Route path="/delivery/tasks" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryTasks /></Layout></ProtectedRoute>} />
      <Route path="/delivery/tasks/:id" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryTaskDetail /></Layout></ProtectedRoute>} />
      <Route path="/delivery/earnings" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryEarnings /></Layout></ProtectedRoute>} />
      <Route path="/delivery/profile" element={<ProtectedRoute roles={["deliveryPartner"]}><Layout><DeliveryProfile /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Layout fullWidth><DashboardAdmin /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
