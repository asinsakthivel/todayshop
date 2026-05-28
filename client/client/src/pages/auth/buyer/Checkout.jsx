import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import api from "../../../api/axios.js";
import AddressCard from "../../../components/AddressCard.jsx";
import "react-toastify/dist/ReactToastify.css";

const DELIVERY_CHARGE = 10;

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const Checkout = () => {
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [addrRes, cartRes] = await Promise.all([
        api.get("/buyer/addresses"),
        api.get("/buyer/cart")
      ]);
      setAddresses(addrRes.data);
      const def = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
      setSelected(def?._id);
      setCart(cartRes.data || { items: [] });
    })()
      .catch(() => toast.error("Failed to load checkout"))
      .finally(() => setLoading(false));
  }, []);

  const place = async () => {
    try {
      setPlacing(true);
      await api.post("/orders/create", { paymentMethod, addressId: selected });
      toast.success("Order placed");
      setTimeout(() => navigate("/buyer/orders"), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  const subTotal = cart.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const total = subTotal + (cart.items?.length ? DELIVERY_CHARGE : 0);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <p className="text-muted text-uppercase small mb-1">Checkout</p>
        <h4 className="mb-0">Review address and payment</h4>
      </div>
      <div className="row g-4">
        <div className="col-md-7">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Delivery Address</h6>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/buyer/addresses")}>
              Manage addresses
            </button>
          </div>
          {loading ? <div className="spinner-border text-primary mb-3" role="status" /> : null}
          {addresses.length ? (
            addresses.map((addr) => (
              <AddressCard key={addr._id} address={addr} selected={selected === addr._id} onSelect={(a) => setSelected(a._id)} />
            ))
          ) : !loading ? (
            <div className="card empty-state-card">
              <div className="card-body p-4">
                <h3 className="h6 mb-2">No saved address yet</h3>
                <p className="text-muted mb-3">Add one address to continue with checkout.</p>
                <button className="btn btn-dark btn-sm" onClick={() => navigate("/buyer/addresses")}>
                  Add address
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="col-md-5">
          <div className="card checkout-summary-card">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Items</span><span>{cart.items?.length || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Product total</span><span>{formatCurrency(subTotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery charge</span><span>{formatCurrency(cart.items?.length ? DELIVERY_CHARGE : 0)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 pt-2 border-top">
                <span className="fw-semibold">Total amount</span><span className="fw-bold">{formatCurrency(total)}</span>
              </div>
              <div className="mb-3">
                <label className="form-label">Payment</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="COD">Cash on Delivery</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <button className="btn btn-primary w-100" disabled={!cart.items?.length || !selected || placing} onClick={place}>
                <i className="bi bi-shield-check me-2" />
                {placing ? "Placing order..." : "Place order"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Checkout;
