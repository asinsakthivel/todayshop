import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios.js";
import { ToastContainer, toast } from "react-toastify";
import useCart from "../../../hooks/useCart.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import "react-toastify/dist/ReactToastify.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ProductDetail = () => {
  const { id } = useParams();
  const { token, role } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [productRes, wishlistRes, reviewsRes, productsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/buyer/wishlist").catch(() => ({ data: [] })),
          api.get(`/reviews/product/${id}`).catch(() => ({ data: [] })),
          api.get(`/products`).catch(() => ({ data: [] })),
        ]);

        setProduct(productRes.data);
        setActiveImage(productRes.data.images?.[0] || null);
        setWishlist(wishlistRes.data);
        setReviews(reviewsRes.data || []);
        setAllProducts(productsRes.data || []);
      } catch {
        toast.error("Failed to load product");
      }
    })();
  }, [id]);

  const requireBuyerLogin = () => {
    if (token && role === "buyer") return true;
    navigate("/login");
    return false;
  };

  const add = async () => {
    if (!requireBuyerLogin()) return;

    try {
      await addToCart(id, quantity);
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to cart");
    }
  };

  const inWishlist = wishlist.some((item) => item._id === id);

  const toggleWishlist = async () => {
    if (!requireBuyerLogin()) return;

    if (inWishlist) {
      await api.delete("/buyer/wishlist", { data: { productId: id } });
      setWishlist((prev) => prev.filter((item) => item._id !== id));
      toast.success("Removed from wishlist");
      return;
    }

    await api.post("/buyer/wishlist", { productId: id });
    setWishlist((prev) => [...prev, product]);
    toast.success("Added to wishlist");
  };

  const relatedProducts = useMemo(
    () => allProducts.filter((item) => item?._id !== id),
    [allProducts, id]
  );

  if (!product) return <div className="py-4">Loading...</div>;

  return (
    <div className="py-4">
      {/* SECTION 1: Product Details */}
      <div className="product-detail-wrap container py-4">
        <div className="product-detail-grid">
          {/* LEFT */}
          <div className="product-detail-left">
            <div className="mb-3">
              {product.images?.length > 1 ? (
                <div className="d-flex gap-2 overflow-auto pb-2">
                  {product.images.map((img, index) => (
                    <button
                      key={img + index}
                      type="button"
                      className={`border rounded ${
                        activeImage === (img || product.images[0])
                          ? "border-primary"
                          : "border-light"
                      }`}
                      onClick={() => setActiveImage(img)}
                      style={{ padding: 0, background: "none" }}
                    >
                      <img
                        src={img}
                        alt={`${product.name}-${index}`}
                        style={{ width: 80, height: 80, objectFit: "cover" }}
                        className="rounded"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <img
              src={activeImage || product.images?.[0] || "https://via.placeholder.com/600"}
              className="img-fluid rounded"
              alt={product.name}
              style={{ maxHeight: 420, objectFit: "cover" }}
            />

            {/* Reviews directly under image */}
            <div className="product-reviews-compact mt-4">
              <div className="d-flex align-items-end justify-content-between gap-2 flex-wrap">
                <h4 className="mb-3">Customer Reviews</h4>
              </div>

              {reviews?.length ? (
                <div className="d-flex flex-column gap-2">
                  {reviews.map((r, idx) => (
                    <div
                      key={idx}
                      className="review-card-compact border rounded-4 p-3 shadow-sm bg-white"
                    >
                      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                        <div className="fw-bold review-customer">
                          {r.customerName || r.buyerId?.name || "Customer"}
                        </div>
                        <div className="review-stars" aria-label={`Rating: ${r.rating}/5`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={i < (r.rating || 0) ? "star gold" : "star"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="review-comment text-muted mt-2">{r.comment}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">No customer reviews yet</div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="product-detail-right">
            <div className="d-flex flex-column gap-2">
              <h3 className="mb-0">{product.name}</h3>
              <div className="text-muted">{product.category}</div>

              {product.sellerId?.shopName || product.sellerId?.name ? (
                <div className="small text-secondary">
                  Sold by {product.sellerId?.shopName || product.sellerId?.name}
                </div>
              ) : null}

              <div className="h4 mb-0">{formatCurrency(product.discountPrice || product.price)}</div>
              <p className="mb-0">{product.description}</p>

              <div className="d-flex align-items-center gap-2 my-3 flex-wrap">
                <label className="form-label me-2 mb-0">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="form-control"
                  style={{ width: 120 }}
                />

                <button className="btn btn-primary" onClick={add}>
                  <i className="bi bi-bag-plus me-2" />
                  Add to Cart
                </button>

                <button
                  className="btn btn-success"
                  onClick={async () => {
                    if (!requireBuyerLogin()) return;

                    try {
                      await addToCart(id, quantity);
                      toast.success("Proceeding to checkout");
                      setTimeout(() => {
                        window.location.href = "/buyer/checkout";
                      }, 100);
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to add item to cart");
                    }
                  }}
                >
                  <i className="bi bi-lightning-charge me-2" />
                  Buy Now
                </button>

                <button
                  className={`btn ${inWishlist ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={toggleWishlist}
                >
                  {inWishlist ? "Wishlisted" : "Wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Related Products (after full product details) */}
      <div className="related-products-section container mt-5 py-3">
        <h4 className="mb-3">Related Products</h4>

        <div className="related-products-grid">
          {relatedProducts.map((p) => (
            <div key={p._id} className="related-product-card card">
              <Link
                to={`/products/${p._id}`}
                className="text-decoration-none text-dark"
              >
                <img
                  src={p.images?.[0] || "https://via.placeholder.com/300"}
                  className="related-product-image"
                  alt={p.name}
                />

                <div className="related-product-body">
                  <div className="related-product-name">{p.name}</div>
                  <div className="related-product-price">
                    {formatCurrency(p.discountPrice || p.price)}
                  </div>
                </div>
              </Link>

              <div className="px-3 pb-3">
                <button
                  className="btn btn-primary btn-sm related-product-add"
                  onClick={async () => {
                    if (!requireBuyerLogin()) return;

                    try {
                      await addToCart(p._id);
                      toast.success("Added to cart");
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to add item to cart");
                    }
                  }}
                >
                  <i className="bi bi-bag-plus me-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ProductDetail;
