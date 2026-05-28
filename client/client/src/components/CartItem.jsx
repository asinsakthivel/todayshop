const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CartItem = ({ item, onChange, onRemove }) => (
  <div className="cart-item-card d-flex flex-column flex-md-row gap-3 align-items-md-center p-3 mb-3">
    <img
      src={item.productId?.images?.[0] || "https://via.placeholder.com/80"}
      alt={item.productId?.name}
      style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 16 }}
    />

    <div className="flex-grow-1">
      <div className="fw-semibold fs-6">{item.productId?.name}</div>

      <div className="text-muted small mb-3">
        {formatCurrency(item.price)} x {item.quantity}
      </div>

      <div className="d-flex flex-wrap gap-2 mt-1">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() =>
            onChange(item.productId._id, Math.max(1, item.quantity - 1))
          }
        >
          <i className="bi bi-dash-lg" />
        </button>

        <span className="cart-qty-pill">{item.quantity}</span>

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() =>
            onChange(item.productId._id, item.quantity + 1)
          }
        >
          <i className="bi bi-plus-lg" />
        </button>

        <button
          className="btn btn-sm btn-outline-danger ms-md-2"
          onClick={() => onRemove(item.productId._id)}
        >
          <i className="bi bi-trash3 me-2" />
          Remove
        </button>
      </div>
    </div>

    <div className="fw-semibold fs-5">
      {formatCurrency(item.price * item.quantity)}
    </div>
  </div>
);

export default CartItem;
