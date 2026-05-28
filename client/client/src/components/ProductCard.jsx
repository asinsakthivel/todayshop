import { Link } from "react-router-dom";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const ProductCard = ({ product, onAdd, previewMode = false }) => {
  const sellerName = product?.sellerId?.shopName || product?.sellerId?.name || product?.shopName || "";
  const detailPath = `/products/${product._id}`;

  return (
    <div className="card h-100 product-card">
      {previewMode ? (
        <img
          src={product.images?.[0] || "https://via.placeholder.com/300"}
          className="card-img-top"
          alt={product.name}
          style={{ objectFit: "cover", height: 180 }}
        />
      ) : (
        <Link to={detailPath}>
          <img
            src={product.images?.[0] || "https://via.placeholder.com/300"}
            className="card-img-top"
            alt={product.name}
            style={{ objectFit: "cover", height: 180 }}
          />
        </Link>
      )}
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
          <div>
            <p className="text-muted small text-uppercase mb-1">{product.category}</p>
            {previewMode ? (
              <h6 className="card-title mb-1">{product.name}</h6>
            ) : (
              <Link className="text-decoration-none text-dark" to={detailPath}>
                <h6 className="card-title mb-1">{product.name}</h6>
              </Link>
            )}
          </div>
          <span className="badge text-bg-light border text-dark fw-medium">Fresh</span>
        </div>
        {sellerName ? <p className="small text-secondary mb-2">by {sellerName}</p> : null}
        <div className="fw-bold mb-2 fs-5">
          {formatCurrency(product.discountPrice || product.price)}
          {product.discountPrice ? (
            <span className="text-decoration-line-through text-muted ms-2 small">{formatCurrency(product.price)}</span>
          ) : null}
        </div>
        <p className="text-muted small mb-3">{product.description?.slice(0, 72) || "Fresh grocery product preview."}</p>
        <div className="mt-auto d-flex gap-2 flex-wrap">
          <Link className="btn btn-outline-secondary btn-sm" to={detailPath}>
            <i className="bi bi-arrow-up-right me-2" />
            Details
          </Link>
          {previewMode ? (
            <button className="btn btn-primary btn-sm" type="button">
              <i className="bi bi-bag-plus me-2" />
              Add to cart
            </button>
          ) : null}
          {onAdd ? (
            <button className="btn btn-primary btn-sm" onClick={() => onAdd(product)}>
              <i className="bi bi-bag-plus me-2" />
              Add to cart
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
