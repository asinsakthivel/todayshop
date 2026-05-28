import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios.js";
import { Link } from "react-router-dom";
import OrderTimeline from "../../components/OrderTimeline.jsx";
import { notifyProductFeedUpdated, subscribeToProductFeedUpdates } from "../../lib/productFeedSync.js";
import { matchesCategoryFilter } from "../../lib/productCategories.js";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value || 0);

const statusLabel = {
  placed: "Placed",
  accepted: "Accepted",
  packed: "Packed",
  readyForPickup: "Out for pickup",
  pickedUp: "Picked up",
  outForDelivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const statusClass = (status) => {
  if (status === "delivered") return "bg-success text-white";
  if (status === "cancelled") return "bg-danger text-white";
  if (["pickedUp", "outForDelivery"].includes(status)) return "bg-info text-white";
  if (status === "packed") return "bg-warning text-dark";
  return "bg-secondary text-white";
};

const approvalBadgeClass = (status) => {
  if (status === "approved") return "bg-success";
  if (status === "rejected") return "bg-danger";
  return "bg-warning text-dark";
};

const getNextStatus = (status) => {
  const steps = ["placed", "accepted", "packed", "readyForPickup", "pickedUp", "outForDelivery", "delivered"];
  const index = steps.indexOf(status);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : null;
};

const Products = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [categories, setCategories] = useState([
    { _id: "all", name: "all", displayName: "All" }
  ]);

  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => {
        const list = (Array.isArray(data) ? data : []).filter(
          (item) => item?.name
        );
        setCategories([
          { _id: "all", name: "all", displayName: "All" },
          ...list
        ]);
      })
      .catch(() =>
        setCategories([{ _id: "all", name: "all", displayName: "All" }])
      );
  }, []);

  const [orders, setOrders] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    address: { label: "", street: "", city: "", state: "", pincode: "" },
    items: [{ productId: "", name: "", quantity: 1, price: 0, image: "" }],
    orderStatus: "placed"
  });
  const [savingOrder, setSavingOrder] = useState(false);

  const loadProducts = async () => {
    const { data } = await api.get("/seller/products");
    setProducts(data);
  };

  const loadOrders = async () => {
    const { data } = await api.get("/seller/orders");
    setOrders(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === "delivery") loadOrders();
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = subscribeToProductFeedUpdates(loadProducts);
    return unsubscribe;
  }, []);

    const filteredProducts = useMemo(() => {
  return products.filter((product) => {
    const matchesSearch = [
      product.name,
      product.category,
      product.description
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const matchesCategory = matchesCategoryFilter(
      product.category,
      category
    );

    return matchesSearch && matchesCategory;
  });
}, [products, search, category]);

// category list is fetched from backend (GET /categories)

  const profitSummary = useMemo(() => {
    const totalCost = products.reduce((sum, product) => sum + ((product.costPrice || 0) * (product.stockQuantity || 0)), 0);
    const totalSell = products.reduce((sum, product) => sum + ((product.price || 0) * (product.stockQuantity || 0)), 0);
    return {
      totalCost,
      totalSell,
      totalProfit: totalSell - totalCost
    };
  }, [products]);

  const orderTotal = deliveryForm.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const readyToSubmit = deliveryForm.items.length > 0 && deliveryForm.items.every((item) => item.name && item.price > 0 && item.quantity > 0);

  const addDeliveryItem = () => {
    setDeliveryForm((current) => ({
      ...current,
      items: [...current.items, { productId: "", name: "", quantity: 1, price: 0, image: "" }]
    }));
  };

  const updateDeliveryItem = (index, changes) => {
    setDeliveryForm((current) => ({
      ...current,
      items: current.items.map((item, idx) => idx === index ? { ...item, ...changes } : item)
    }));
  };

  const removeDeliveryItem = (index) => {
    setDeliveryForm((current) => ({
      ...current,
      items: current.items.filter((_, idx) => idx !== index)
    }));
  };

  const resetDeliveryForm = () => {
    setEditingOrder(null);
    setShowCreate(false);
    setDeliveryForm({
      address: { label: "", street: "", city: "", state: "", pincode: "" },
      items: [{ productId: "", name: "", quantity: 1, price: 0, image: "" }],
      orderStatus: "placed"
    });
  };

  const submitOrder = async () => {
    if (!readyToSubmit) return;
    setSavingOrder(true);
    try {
      if (editingOrder) {
        await api.put(`/seller/orders/${editingOrder}`, {
          address: deliveryForm.address,
          items: deliveryForm.items
        });
      } else {
        await api.post("/seller/orders", {
          address: deliveryForm.address,
          items: deliveryForm.items,
          orderStatus: deliveryForm.orderStatus
        });
      }
      await loadOrders();
      resetDeliveryForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOrder(false);
    }
  };

  const deleteOrder = async (id) => {
    await api.delete(`/seller/orders/${id}`);
    await loadOrders();
  };

  const advanceOrder = async (order) => {
    const next = getNextStatus(order.orderStatus);
    if (!next) return;
    await api.put(`/seller/orders/${order._id}/status`, { status: next });
    await loadOrders();
  };

  const editOrder = (order) => {
    setEditingOrder(order._id);
    setShowCreate(true);
    setDeliveryForm({
      address: {
        label: order.deliveryAddress?.label || "",
        street: order.deliveryAddress?.street || "",
        city: order.deliveryAddress?.city || "",
        state: order.deliveryAddress?.state || "",
        pincode: order.deliveryAddress?.pincode || ""
      },
      items: order.items.map((item) => ({
        productId: item.productId || "",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || ""
      })),
      orderStatus: order.orderStatus
    });
  };

  return (
    <div className={embedded ? "" : "container py-4"}>
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-1">Seller Workspace</h4>
          <p className="text-muted mb-0">Manage products, review profitability, and create delivery orders from one place.</p>
        </div>
        {!embedded && (
          <div className="btn-group" role="group">
            {[
              { key: "products", label: "Products" },
              { key: "profit", label: "Profit" },
              { key: "delivery", label: "Delivery" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "products" && (
        <>
          <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
            <div className="flex-grow-1 row g-2">
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>
                        {cat.displayName || cat.name}
                      </option>
                    ))}
                </select>

              </div>
            </div>
            <Link className="btn btn-primary" to="/seller/products/add">+ Add product</Link>
          </div>

          {filteredProducts.length ? (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
              {filteredProducts.map((product) => {
                const profit = Number(product.price || 0) - Number(product.costPrice || 0);
                const margin = product.price ? (profit / product.price) * 100 : 0;
                return (
                  <div key={product._id} className="card shadow-sm border-0">
                    <div className="card-body">
                      <div className="d-flex gap-2 mb-3">
                        {(product.images || []).slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt={`${product.name}-${idx}`} className="rounded" style={{ width: 72, height: 72, objectFit: "cover" }} />
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">{product.name}</h5>
                          <div className="text-muted small">{product.category || "Uncategorized"}</div>
                        </div>
                        <div className="d-flex flex-column gap-2 align-items-end">
                          <span className={`badge ${product.stockQuantity > 0 ? "bg-success" : "bg-danger"}`}>{product.stockQuantity > 0 ? "In stock" : "Out of stock"}</span>
                          <span className={`badge ${approvalBadgeClass(product.approvalStatus)}`}>{product.approvalStatus || "pending"}</span>
                        </div>
                      </div>
                      <div className="mb-2 small text-muted">Cost: {formatCurrency(product.costPrice || 0)} · Sell: {formatCurrency(product.price)}</div>
                      {product.approvalNote ? (
                        <div className="alert alert-light border py-2 px-3 small mb-3">
                          Admin note: {product.approvalNote}
                        </div>
                      ) : null}
                      <div className="d-flex gap-3 mb-3">
                        <div>
                          <div className="text-muted small">Profit/unit</div>
                          <div className="fw-bold">{formatCurrency(profit)}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Margin</div>
                          <div className={`fw-bold ${margin >= 25 ? "text-success" : margin > 0 ? "text-warning" : "text-danger"}`}>{margin.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Link className="btn btn-sm btn-outline-secondary" to={`/seller/products/${product._id}`}>Edit</Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => { if (window.confirm("Delete product?")) { api.delete(`/seller/products/${product._id}`).then(() => { notifyProductFeedUpdated(); loadProducts(); }); } }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card shadow-sm p-4 text-center text-muted">No products match your search or filter.</div>
          )}
        </>
      )}

      {activeTab === "profit" && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: "Total Cost", value: profitSummary.totalCost, variant: "bg-light" },
              { label: "Sell Value", value: profitSummary.totalSell, variant: "bg-primary text-white" },
              { label: "Net Profit", value: profitSummary.totalProfit, variant: profitSummary.totalProfit >= 0 ? "bg-success text-white" : "bg-danger text-white" }
            ].map((stat) => (
              <div key={stat.label} className="col-md-4">
                <div className={`card shadow-sm border-0 ${stat.variant}`}>
                  <div className="card-body">
                    <div className="text-muted small">{stat.label}</div>
                    <div className="h4 mb-0">{formatCurrency(stat.value)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Cost</th>
                    <th>Sell</th>
                    <th>Stock</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const profit = Number(product.price || 0) - Number(product.costPrice || 0);
                    const margin = product.price ? (profit / product.price) * 100 : 0;
                    return (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{formatCurrency(product.costPrice || 0)}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>{product.stockQuantity || 0}</td>
                        <td>{formatCurrency(profit)}</td>
                        <td className={margin >= 25 ? "text-success" : margin > 0 ? "text-warning" : "text-danger"}>{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "delivery" && (
        <div className="row g-4">
          <div className="col-12 d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-1">Delivery Orders</h4>
              <p className="text-muted mb-0">Create orders, track progress, and manage delivery steps.</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setShowCreate((value) => !value); setEditingOrder(null); }}>
              {showCreate ? "Close form" : "+ New delivery"}
            </button>
          </div>
          {showCreate && (
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Label</label>
                      <input className="form-control" value={deliveryForm.address.label} onChange={(e) => setDeliveryForm((current) => ({ ...current, address: { ...current.address, label: e.target.value } }))} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Street address</label>
                      <input className="form-control" value={deliveryForm.address.street} onChange={(e) => setDeliveryForm((current) => ({ ...current, address: { ...current.address, street: e.target.value } }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input className="form-control" value={deliveryForm.address.city} onChange={(e) => setDeliveryForm((current) => ({ ...current, address: { ...current.address, city: e.target.value } }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <input className="form-control" value={deliveryForm.address.state} onChange={(e) => setDeliveryForm((current) => ({ ...current, address: { ...current.address, state: e.target.value } }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pincode</label>
                      <input className="form-control" value={deliveryForm.address.pincode} onChange={(e) => setDeliveryForm((current) => ({ ...current, address: { ...current.address, pincode: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">Order items</div>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={addDeliveryItem}>Add item</button>
                    </div>
                    <div className="row g-3">
                      {deliveryForm.items.map((item, index) => (
                        <div key={index} className="col-12">
                          <div className="card p-3 bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="fw-semibold">Item {index + 1}</div>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDeliveryItem(index)}>Remove</button>
                            </div>
                            <div className="row g-2">
                              <div className="col-md-3">
                                <label className="form-label">Product</label>
                                <select
                                  className="form-select"
                                  value={item.productId}
                                  onChange={(e) => {
                                    const selected = products.find((product) => product._id === e.target.value);
                                    updateDeliveryItem(index, {
                                      productId: e.target.value,
                                      name: selected?.name || "",
                                      price: selected?.price || 0,
                                      image: selected?.images?.[0] || ""
                                    });
                                  }}
                                >
                                  <option value="">Select a product</option>
                                  {products.map((product) => (
                                    <option key={product._id} value={product._id}>{product.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Name</label>
                                <input className="form-control" value={item.name} onChange={(e) => updateDeliveryItem(index, { name: e.target.value })} />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label">Qty</label>
                                <input type="number" min="1" className="form-control" value={item.quantity} onChange={(e) => updateDeliveryItem(index, { quantity: Number(e.target.value) })} />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label">Price</label>
                                <input type="number" min="0" className="form-control" value={item.price} onChange={(e) => updateDeliveryItem(index, { price: Number(e.target.value) })} />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label">Image URL</label>
                                <input className="form-control" value={item.image} onChange={(e) => updateDeliveryItem(index, { image: e.target.value })} placeholder="Optional" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted small">Total order value</div>
                      <div className="h4 mb-0">{formatCurrency(orderTotal)}</div>
                    </div>
                    <button type="button" className="btn btn-success" disabled={!readyToSubmit || savingOrder} onClick={submitOrder}>
                      {editingOrder ? "Update order" : "Save order"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            {orders.length ? orders.map((order) => (
              <div key={order._id} className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3">
                    <div>
                      <div className="fw-semibold">Order #{order._id}</div>
                      <div className="text-muted small">Total {formatCurrency(order.totalAmount)} • {order.items.length} items</div>
                    </div>
                    <span className={`badge ${statusClass(order.orderStatus)}`}>{statusLabel[order.orderStatus] || order.orderStatus}</span>
                  </div>
                  <OrderTimeline status={order.orderStatus} />
                  <div className="row g-3 mt-3">
                    <div className="col-md-6">
                      <div className="text-muted small mb-1">Delivery address</div>
                      <div>{order.deliveryAddress?.street}</div>
                      <div>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small mb-1">Items</div>
                      <div className="d-flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="badge bg-light text-dark border">{item.name} x{item.quantity}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {getNextStatus(order.orderStatus) ? (
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => advanceOrder(order)}>Mark next step</button>
                    ) : null}
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => editOrder(order)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { if (window.confirm("Remove this delivery order?")) deleteOrder(order._id); }}>Delete</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="card shadow-sm p-4 text-center text-muted">No delivery orders found yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
