import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import useSocket from "../hooks/useSocket.js";
import { normalizeOrderStatus, getStatusBadge, getStatusLabel } from "../lib/orderStatus";
import "react-toastify/dist/ReactToastify.css";

const formatCurrency = (amount) => `Rs ${Number(amount).toLocaleString()}`;

const DashboardSeller = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [stats, setStats] = useState({ revenue: 0, orderCount: 0, topProducts: [], notifications: [] });
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/seller/analytics");
      if (data?.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  const loadConfirmedOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/seller/orders");
      if (Array.isArray(data)) {
        // Filter for confirmed/delivered orders and sort by most recent
        const confirmed = data
          .filter(order => {
            const status = normalizeOrderStatus(order.orderStatus);
            return ["DELIVERED", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status);
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); // Show only top 5
        setConfirmedOrders(confirmed);
      }
    } catch (err) {
      console.error("Failed to load confirmed orders", err);
    }
  }, []);

  useEffect(() => {
    // Fetches revenue and product performance from the seller controller
    Promise.all([
      api.get("/seller/analytics"),
      api.get("/seller/orders")
    ])
      .then(([{ data: analyticsData }, { data: ordersData }]) => {
        setStats(analyticsData);
        if (analyticsData?.notifications) {
          setNotifications(analyticsData.notifications);
        }
        // Load all orders
        if (Array.isArray(ordersData)) {
          setAllOrders(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          // Load confirmed orders
          const confirmed = ordersData
            .filter(order => {
              const status = normalizeOrderStatus(order.orderStatus);
              return ["DELIVERED", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status);
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          setConfirmedOrders(confirmed);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socketClient = socket.current;
    const handler = (payload) => {
      if (payload?.status) {
        loadNotifications();
        if (payload.status === "READY_FOR_PICKUP") {
          toast.info("Order is ready for pickup - delivery partner will be notified.");
        } else {
          toast.success(`Order status updated to ${payload.status}.`);
        }
      }
    };

    socketClient?.on("orderUpdate", handler);
    return () => socketClient?.off("orderUpdate", handler);
  }, [socket, loadNotifications]);

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm border-0 bg-primary text-white p-4 text-center">
            <h3>Welcome back, {user?.name}!</h3>
            <p className="mb-0 text-white-50">Manage your store and track your sales performance.</p>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Recent Notifications</h5>
                <Link to="/seller/orders" className="btn btn-outline-primary btn-sm">View Orders</Link>
              </div>
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="list-group-item d-flex justify-content-between align-items-start py-2">
                      <div>
                        <div className="fw-medium">{notification.message}</div>
                        <div className="text-muted small">
                          {notification.time ? new Date(notification.time).toLocaleString() : ''}
                        </div>
                      </div>
                      <span className={`badge ${notification.type === 'delivery' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                        {notification.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted">No recent notifications</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm border-0 h-100">
            <h6 className="text-muted">Total Revenue</h6>
            <h2 className="fw-bold text-success">Rs {stats.revenue}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm border-0 h-100">
            <h6 className="text-muted">Orders Fulfilled</h6>
            <h2 className="fw-bold text-primary">{stats.orderCount}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-3 shadow-sm border-0 h-100">
            <h6 className="text-muted">Store Visibility</h6>
            <h2 className="fw-bold text-warning">High</h2>
          </div>
        </div>
      </div>

      {/* All Orders Section */}
      <div className="row g-3 mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">All Orders ({allOrders.length})</h5>
                <Link to="/seller/orders" className="btn btn-outline-primary btn-sm">View All Orders</Link>
              </div>
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : allOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Products</th>
                        <th>Buyer</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.slice(0, 10).map((order) => (
                        <tr key={order._id}>
                          <td>
                            <small className="fw-medium">#{order._id.slice(-6).toUpperCase()}</small>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-2">
                              {order.items && order.items.map((item, idx) => (
                                <div key={idx} className="d-flex align-items-center gap-2">
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                  ) : (
                                    <div style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <small className="text-muted">No img</small>
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-medium" style={{ fontSize: '0.8rem' }}>
                                      {item.name}
                                    </div>
                                    <small className="text-muted">
                                      Qty: {item.quantity} × {formatCurrency(item.price)}
                                    </small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div>
                              <small className="fw-medium">{order.buyerId?.name || 'Customer'}</small>
                              {order.deliveryAddress && (
                                <div className="text-muted" style={{ fontSize: '0.7rem', maxWidth: '150px' }}>
                                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(normalizeOrderStatus(order.orderStatus))}`}>
                              {getStatusLabel(normalizeOrderStatus(order.orderStatus))}
                            </span>
                          </td>
                          <td>
                            <small className="fw-medium">{formatCurrency(order.totalAmount)}</small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <Link to={`/seller/orders/${order._id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">No orders yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Orders Section */}
      <div className="row g-3 mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Confirmed Orders</h5>
                <Link to="/seller/orders" className="btn btn-outline-primary btn-sm">View All Orders</Link>
              </div>
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : confirmedOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Items</th>
                        <th>Buyer</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedOrders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <small className="fw-medium">#{order._id.slice(-6).toUpperCase()}</small>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {order.items && order.items.length > 0 && order.items[0].image && (
                                <img 
                                  src={order.items[0].image} 
                                  alt={order.items[0].name}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                              )}
                              <div>
                                <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                                  {order.items && order.items.length > 0 ? order.items[0].name : 'No items'}
                                </div>
                                {order.items && order.items.length > 1 && (
                                  <small className="text-muted">+{order.items.length - 1} more item(s)</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <small>{order.buyerId?.name || 'Customer'}</small>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(normalizeOrderStatus(order.orderStatus))}`}>
                              {getStatusLabel(normalizeOrderStatus(order.orderStatus))}
                            </span>
                          </td>
                          <td>
                            <small className="fw-medium">{formatCurrency(order.totalAmount)}</small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">No confirmed orders yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Management</h5>
              <div className="d-grid gap-2">
                <Link to="/products" className="btn btn-outline-primary py-2">Manage Products</Link>
                <Link to="/orders" className="btn btn-outline-primary py-2">Incoming Orders</Link>
                <Link to="/reviews" className="btn btn-outline-secondary py-2">Customer Feedback</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title mb-3">Top Products</h5>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              ) : stats.topProducts.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.topProducts.map(p => (
                    <div key={p._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      {p.name}
                      <span className="badge bg-light text-dark border">{p.reviewCount} reviews</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No analytics data available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default DashboardSeller;
