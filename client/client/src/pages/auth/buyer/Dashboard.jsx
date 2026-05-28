import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import api from "../../../api/axios.js";
import BuyerReviewModal from "../../../components/BuyerReviewModal.jsx";
import ProductCard from "../../../components/ProductCard.jsx";
import useCart from "../../../hooks/useCart.js";
import { normalizeDeliveryStatus } from "../../../lib/deliveryStatus.js";
import { matchesCategoryFilter } from "../../../lib/productCategories.js";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const { addToCart: addToCartHook } = useCart();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [dashboardError, setDashboardError] = useState("");
  const [reviewOrder, setReviewOrder] = useState(null);

  const [searchParams] = useSearchParams();
  const productsRef = useRef(null);

  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";
  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 0);

  useEffect(() => {
    if (selectedCategory && productsRef.current) {
      productsRef.current.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [selectedCategory]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value || 0);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products");
      return data || [];
    } catch {
      return [];
    }
  };

  const loadDeliveredOrders = async () => {
    try {
      const { data } = await api.get("/buyer/orders");

      return (data || []).filter(
        (order) =>
          normalizeDeliveryStatus(order.orderStatus) === "DELIVERED" &&
          !order.reviewSubmitted
      );
    } catch {
      return [];
    }
  };

  const loadDashboard = async () => {
    try {
      const [productData, deliveredData] = await Promise.all([
        fetchProducts(),
        loadDeliveredOrders()
      ]);

      setAllProducts(productData);
      setProducts(productData.slice(0, 6));
      setDeliveredOrders(deliveredData);
      setDashboardError("");
    } catch {
      setDashboardError("Products are unavailable right now.");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filterSource =
    selectedCategory || searchQuery || minPrice || maxPrice
      ? allProducts
      : products;

  const filteredProducts = filterSource.filter((product) => {
    const categoryMatch = selectedCategory
      ? matchesCategoryFilter(product.category, selectedCategory)
      : true;

    const queryMatch = searchQuery
      ? [product.name, product.description].some((text) =>
          String(text || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : true;

    const minMatch = minPrice ? product.price >= minPrice : true;
    const maxMatch = maxPrice ? product.price <= maxPrice : true;

    return categoryMatch && queryMatch && minMatch && maxMatch;
  });

  const addToCart = async (product) => {
    try {
      await addToCartHook(product._id);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to cart");
    }
  };

  return (
    <div className="buyer-dashboard">

      {dashboardError && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="fw-semibold">Unable to load products</div>
            <div className="text-muted small">{dashboardError}</div>
          </div>
        </div>
      )}

      <div className="dashboard-hero">
        <img
          src="/banner.png"
          alt="Banner"
          className="w-100 rounded-4 shadow-lg mb-4"
          style={{ maxHeight: "300px", objectFit: "cover" }}
        />

        <div>
          <h2>Fresh Groceries at Your Doorstep</h2>
          <p className="text-muted">Premium groceries delivered fast.</p>
        </div>

        <Link to="/products" className="btn btn-primary px-4">
          Start Shopping
        </Link>
      </div>

      <div ref={productsRef} className="row g-4">
        {filteredProducts.map((product) => (
          <div className="col-6 col-md-4 col-xl-3" key={product._id}>
            <ProductCard product={product} onAdd={addToCart} />
          </div>
        ))}
      </div>

      <div className="recent-delivered-section mt-5">
        <h5 className="mb-3">Orders Waiting For Review</h5>

        {deliveredOrders.length ? (
          <div className="row g-3">
            {deliveredOrders.map((order) => (
              <div key={order._id} className="col-6 col-md-3 col-lg-2">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body p-2 text-center">

                    <img
                      src={order.productImage || "/vite.svg"}
                      alt={order.productName}
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "cover"
                      }}
                      className="rounded mb-2"
                    />

                    <h6
                      className="small fw-semibold text-truncate mb-1"
                      style={{ fontSize: "13px" }}
                    >
                      {order.productName}
                    </h6>

                    <small className="d-block text-muted">
                      #{order._id.slice(-6)}
                    </small>

                    <div
                      className="text-success fw-semibold mb-2"
                      style={{ fontSize: "12px" }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </div>

                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => setReviewOrder(order)}
                    >
                      Review
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-success py-4">
            All delivered orders reviewed
          </div>
        )}
      </div>

      <BuyerReviewModal
        order={reviewOrder}
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        onSubmitted={async () => {
          setReviewOrder(null);
          await loadDashboard();
        }}
      />

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Dashboard;
