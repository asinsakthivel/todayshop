
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import api from "../../../api/axios.js";
import ProductCard from "../../../components/ProductCard.jsx";
import useCart from "../../../hooks/useCart.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { matchesCategoryFilter } from "../../../lib/productCategories.js";
import "react-toastify/dist/ReactToastify.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const Products = () => {
  const { token, role } = useAuth();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/products");
        setProducts(data || []);
      } catch {
        setError("Products are unavailable right now.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = selectedCategory
        ? matchesCategoryFilter(product.category, selectedCategory)
        : true;

      const searchMatch = searchQuery
        ? product.name?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const minMatch = minPrice
        ? product.price >= Number(minPrice)
        : true;

      const maxMatch = maxPrice
        ? product.price <= Number(maxPrice)
        : true;

      return categoryMatch && searchMatch && minMatch && maxMatch;
    });
  }, [products, selectedCategory, searchQuery, minPrice, maxPrice]);

  const handleAddToCart = async (product) => {
    if (!token || role !== "buyer") {
      navigate("/login");
      return;
    }

    try {
      await addToCart(product._id);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to cart");
    }
  };
  
  return (
    <section className="buyer-dashboard">
      <div className="dashboard-hero mb-4">
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

        <Link
          to={token && role === "buyer" ? "/buyer" : "/login"}
          className="btn btn-primary px-4"
        >
          Start Shopping
        </Link>
      </div>

      {error ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="fw-semibold">Unable to load products</div>
            <div className="text-muted small">{error}</div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="card empty-state-card">
          <div className="card-body p-4 text-center">
            Loading products...
          </div>
        </div>
      ) : filteredProducts.length ? (
        <div className="row g-4">
          {filteredProducts.map((product) => (
            <div
              className="col-6 col-md-4 col-xl-3"
              key={product._id}
            >
              <ProductCard
                product={product}
                onAdd={handleAddToCart}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state-card">
          <div className="card-body p-4 text-center">
            No products found
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </section>
  );
};

export default Products;
