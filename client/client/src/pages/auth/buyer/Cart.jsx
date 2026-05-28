import { useNavigate } from "react-router-dom";
import CartItem from "../../../components/CartItem.jsx";
import useCart from "../../../hooks/useCart.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Cart = () => {
  const { cart, updateItem, clearCart, loading } = useCart();
  const navigate = useNavigate();
  const total = cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <p className="text-muted text-uppercase small mb-1">Cart</p>
          <h4 className="mb-0">Your selected items</h4>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={clearCart}>Clear cart</button>
      </div>
      {loading ? <div className="spinner-border text-primary" role="status" /> : null}
      {cart.items?.length ? (
        <>
          {cart.items.map((item) => (
            <CartItem key={item.productId._id} item={item} onChange={updateItem} onRemove={(id) => updateItem(id, 0)} />
          ))}
          <div className="card p-4 mt-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="text-muted small">Order total</div>
                <div className="fw-bold fs-4">{formatCurrency(total)}</div>
              </div>
              <button className="btn btn-primary" disabled={!cart.items?.length} onClick={() => navigate("/buyer/checkout")}>
                <i className="bi bi-bag-check me-2" />
                Continue to checkout
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="card empty-state-card">
          <div className="card-body p-4 p-lg-5 text-center">
            <i className="bi bi-bag fs-1 text-muted d-block mb-3" />
            <h3 className="h5 mb-2">Your cart is empty</h3>
            <p className="text-muted mb-4">Start from browse and add a few essentials to your basket.</p>
            <button className="btn btn-dark" onClick={() => navigate("/buyer") }>
              <i className="bi bi-search me-2" />
              Explore products
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
