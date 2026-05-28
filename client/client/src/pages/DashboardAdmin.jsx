import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const getInitials = (value = "") => value
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || "")
  .join("") || "AD";

const approvalBadgeClass = (status) => {
  if (status === "approved") return "bg-success";
  if (status === "rejected") return "bg-danger";
  if (status === "pending") return "bg-primary text-white";
  return "bg-warning text-dark";
};

const StatusPill = ({ status }) => (
  <span className={`badge ${approvalBadgeClass(status)}`}>{status || "pending"}</span>
);

const SummaryCard = ({ label, value, tone = "admin-tone-neutral" }) => (
  <div className="col-6 col-md-4 col-xl-3">
    <div className={`card border-0 shadow-sm h-100 admin-summary-card ${tone}`}>
      <div className="card-body">
        <div className="admin-summary-label">{label}</div>
        <div className="fs-3 fw-semibold admin-summary-value">{value}</div>
      </div>
    </div>
  </div>
);

const SidebarButton = ({ label, count, active, onClick }) => (
  <button
    type="button"
    className={`btn admin-sidebar-btn ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <span>{label}</span>
    <span className="admin-sidebar-count">{count}</span>
  </button>
);

const TableCard = ({ title, subtitle, children, actions = null }) => (
  <div className="card shadow-sm border-0 admin-table-card">
    <div className="card-body p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3 admin-table-head">
        <div>
          <h5 className="mb-1 admin-table-title">{title}</h5>
          <p className="text-muted small mb-0 admin-table-subtitle">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  </div>
);

const QueueItem = ({ item, busy, onApprove, onReject, onDelete, onOpen }) => (
  <div className="admin-queue-item">
    <div className={`admin-queue-avatar tone-${item.tone}`}>{getInitials(item.name)}</div>
    <div className="admin-queue-copy">
      <div className="admin-queue-name">{item.name}</div>
      <div className="admin-queue-subtitle">{item.subtitle}</div>
      <div className="admin-queue-meta">{item.meta}</div>
    </div>
    <div className="admin-queue-actions">
      <button className="btn admin-inline-btn" type="button" disabled={busy} onClick={onApprove}>Approve</button>
      <button className="btn admin-inline-btn secondary" type="button" disabled={busy} onClick={onReject}>Reject</button>
      {onDelete ? (
        <button className="btn admin-inline-btn danger" type="button" disabled={busy} onClick={onDelete}>Delete</button>
      ) : null}
      <button className="btn admin-inline-link" type="button" onClick={onOpen}>Open</button>
    </div>
  </div>
);

const RecentSellerItem = ({ seller, onOpen }) => (
  <div className="admin-recent-item">
    <div className="admin-recent-left">
      <div className="admin-queue-avatar tone-mint">{getInitials(seller.shopName || seller.name)}</div>
      <div>
        <div className="admin-recent-name">{seller.shopName || seller.name || "Seller"}</div>
        <div className="admin-recent-subtitle">{seller.name || seller.email || "No contact"}</div>
      </div>
    </div>
    <button className={`badge admin-status-chip ${seller.approvalStatus === "approved" ? "approved" : seller.approvalStatus === "rejected" ? "rejected" : "pending"}`} type="button" onClick={onOpen}>
      {seller.approvalStatus || "pending"}
    </button>
  </div>
);

const ActionButtons = ({ onApprove, onReject, onDelete, busy, disableDelete = false }) => (
  <div className="d-flex flex-wrap gap-2">
    {onApprove ? <button className="btn btn-success btn-sm" type="button" disabled={busy} onClick={onApprove}>Approve</button> : null}
    {onReject ? <button className="btn btn-outline-warning btn-sm" type="button" disabled={busy} onClick={onReject}>Reject</button> : null}
    <button className="btn btn-outline-danger btn-sm" type="button" disabled={busy || disableDelete} onClick={onDelete}>Delete</button>
  </div>
);

const DashboardAdmin = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [data, setData] = useState({
    buyers: [],
    sellers: [],
    deliveryPartners: [],
    admins: [],
    products: [],
    deliveryApplications: [],
    counts: {
      totalUsers: 0,
      buyerCount: 0,
      sellerCount: 0,
      deliveryPartnerCount: 0,
      adminCount: 0,
      sellerPending: 0,
      productPending: 0,
      deliveryPending: 0,
      ordersPendingApproval: 0,
      ordersCompleted: 0
    }
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [notes, setNotes] = useState({});
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data: response } = await api.get("/admin/overview");
      setData(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load admin dashboard");
    }
  };

  const loadOrders = async () => {
    try {
      const { data: orders } = await api.get("/admin/orders/pending");
      setPendingOrders(orders || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load pending orders");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeSection === "orders") {
      loadOrders();
    }
  }, [activeSection]);

  const setNote = (key, value) => {
    setNotes((current) => ({ ...current, [key]: value }));
  };

  const handleDecision = async (type, id, status) => {
    const key = `${type}:${id}`;
    setBusyKey(key);
    try {
      const payload = { status, note: notes[key] || "" };
      if (type === "seller") await api.patch(`/admin/sellers/${id}`, payload);
      if (type === "product") await api.patch(`/admin/products/${id}`, payload);
      if (type === "delivery") await api.patch(`/admin/delivery-apps/${id}`, payload);
      if (type === "order" && status === "approved") await api.patch(`/admin/orders/${id}/approve`, payload);
      if (type === "order" && status === "rejected") await api.patch(`/admin/orders/${id}/reject`, payload);
      await load();
      if (type === "order") await loadOrders();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save admin decision");
    } finally {
      setBusyKey("");
    }
  };

  const handleDelete = async (type, id, label) => {
    const confirmed = window.confirm(`Delete ${label}? This action cannot be undone.`);
    if (!confirmed) return;

    const key = `delete:${type}:${id}`;
    setBusyKey(key);
    try {
      if (type === "user") await api.delete(`/admin/users/${id}`);
      if (type === "product") await api.delete(`/admin/products/${id}`);
      if (type === "delivery") await api.delete(`/admin/delivery-apps/${id}`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Failed to delete ${label}`);
    } finally {
      setBusyKey("");
    }
  };

  const clearSellerProductFilter = () => setSelectedSeller(null);

  const peopleRows = useMemo(() => ([
    ...(data.buyers || []).map((user) => ({ ...user, roleLabel: "Buyer" })),
    ...(data.sellers || []).map((user) => ({ ...user, roleLabel: "Seller" })),
    ...(data.deliveryPartners || []).map((user) => ({ ...user, roleLabel: "Delivery Partner" })),
    ...(data.admins || []).map((user) => ({ ...user, roleLabel: "Admin" }))
  ]).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [data]);

  const sellers = useMemo(
    () => [...(data.sellers || [])].sort((a, b) => Number(b.approvalStatus === "pending") - Number(a.approvalStatus === "pending")),
    [data.sellers]
  );

  const products = useMemo(
    () => [...(data.products || [])].sort((a, b) => Number(b.approvalStatus === "pending") - Number(a.approvalStatus === "pending")),
    [data.products]
  );

  const filteredProducts = useMemo(
    () => selectedSeller
      ? products.filter((product) => product.sellerId?._id === selectedSeller._id)
      : products,
    [products, selectedSeller]
  );

  const deliveryApplications = useMemo(
    () => [...(data.deliveryApplications || [])].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending")),
    [data.deliveryApplications]
  );

  const pendingSellers = useMemo(
    () => sellers.filter((seller) => seller.approvalStatus === "pending"),
    [sellers]
  );

  const pendingProducts = useMemo(
    () => products.filter((product) => product.approvalStatus === "pending"),
    [products]
  );

  const pendingDeliveryApplications = useMemo(
    () => deliveryApplications.filter((application) => application.status === "pending"),
    [deliveryApplications]
  );

  const recentSellers = useMemo(
    () => [...(data.sellers || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
    [data.sellers]
  );

  const overviewQueueItems = useMemo(
    () => ([
      ...pendingSellers.map((seller) => ({
        id: seller._id,
        type: "seller",
        section: "sellers",
        name: seller.shopName || seller.name || "Seller",
        subtitle: seller.email || seller.phone || "No contact",
        meta: "Seller approval",
        tone: "sky"
      })),
      ...pendingProducts.map((product) => ({
        id: product._id,
        type: "product",
        section: "products",
        name: product.name || "Product",
        subtitle: product.sellerId?.shopName || product.sellerId?.name || "Seller",
        meta: "Product review",
        tone: "peach"
      })),
      ...pendingDeliveryApplications.map((application) => ({
        id: application._id,
        type: "delivery",
        section: "delivery",
        name: application.name || application.applicant?.name || "Delivery Partner",
        subtitle: application.phone || application.applicant?.phone || "No phone",
        meta: "Delivery application",
        tone: "mint"
      }))
    ]).slice(0, 5),
    [pendingDeliveryApplications, pendingProducts, pendingSellers]
  );

  const totalPendingItems = pendingSellers.length + pendingProducts.length + pendingDeliveryApplications.length;

  const menuButtons = [
    { id: "overview", label: "Overview", count: data.counts?.totalUsers || 0 },
    { id: "people", label: "Users", count: peopleRows.length },
    { id: "sellers", label: "Sellers", count: data.counts?.sellerCount || sellers.length },
    { id: "delivery", label: "Delivery partners", count: data.counts?.deliveryPartnerCount || deliveryApplications.length },
    { id: "products", label: "Product list", count: products.length },
    { id: "orders", label: "Pending orders", count: data.counts?.ordersPendingApproval || 0 }
  ];

  return (
    <div className="container-fluid py-2 admin-dashboard">
      {error ? <div className="alert alert-danger admin-alert">{error}</div> : null}

      <div className="admin-panel-shell">
        <div className="admin-shell">
          <aside className="admin-sidebar-card">
            <div className="admin-sidebar-section">
              <div className="admin-sidebar-label">Menu</div>
              <div className="admin-sidebar-stack">
                {menuButtons.map((section) => (
                  <SidebarButton
                    key={section.id}
                    label={section.label}
                    count={section.count}
                    active={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                  />
                ))}
              </div>
            </div>

            <div className="admin-sidebar-divider" />
            <button className="btn admin-refresh-btn w-100 mt-3" type="button" onClick={load}>Refresh dashboard</button>
          </aside>

          <div className="d-flex flex-column gap-4">
            {activeSection === "overview" ? (
              <>
                <div className="row g-3">
                  <SummaryCard label="Total users" value={data.counts?.totalUsers || 0} />
                  <SummaryCard label="Buyers" value={data.counts?.buyerCount || 0} tone="admin-tone-sky" />
                  <SummaryCard label="Sellers" value={data.counts?.sellerCount || 0} tone="admin-tone-ocean" />
                  <SummaryCard label="Delivery partners" value={data.counts?.deliveryPartnerCount || 0} tone="admin-tone-mint" />
                  <SummaryCard label="Admins" value={data.counts?.adminCount || 0} tone="admin-tone-slate" />
                  <SummaryCard label="Products" value={products.length} />
                  <SummaryCard label="Pending sellers" value={pendingSellers.length} tone="admin-tone-amber" />
                  <SummaryCard label="Pending products" value={pendingProducts.length} tone="admin-tone-amber" />
                  <SummaryCard label="Pending delivery" value={pendingDeliveryApplications.length} tone="admin-tone-amber" />
                  <SummaryCard label="Pending orders" value={data.counts?.ordersPendingApproval || 0} tone="admin-tone-amber" />
                  <SummaryCard label="Completed orders" value={data.counts?.ordersCompleted || 0} tone="admin-tone-mint" />
                </div>

                <div className="admin-overview-grid">
                  <div className="card border-0 shadow-sm admin-overview-card">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                        <h5 className="admin-card-title mb-0">Pending approvals</h5>
                        <span className="admin-overview-count">{totalPendingItems}</span>
                      </div>

                      {overviewQueueItems.length ? (
                        <div className="admin-queue-list">
                          {overviewQueueItems.map((item) => {
                            const itemBusy = busyKey === `${item.type}:${item.id}`;
                            return (
                              <QueueItem
                                key={`${item.type}:${item.id}`}
                                item={item}
                                busy={itemBusy}
                                onApprove={() => handleDecision(item.type, item.id, "approved")}
                                onReject={() => handleDecision(item.type, item.id, "rejected")}
                                onDelete={
                                  item.type === "seller"
                                    ? () => handleDelete("user", item.id, "seller account")
                                    : item.type === "product"
                                      ? () => handleDelete("product", item.id, "product")
                                      : item.type === "delivery"
                                        ? () => handleDelete("delivery", item.id, "delivery application")
                                        : undefined
                                }
                                onOpen={() => setActiveSection(item.section)}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="admin-empty-state">All pending approvals are cleared right now.</div>
                      )}
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm admin-overview-card">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                        <h5 className="admin-card-title mb-0">Recent sellers</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span className="admin-overview-count">{data.counts?.sellerCount || sellers.length}</span>
                          <button className="btn admin-inline-link" type="button" onClick={() => setActiveSection("sellers")}>Open sellers</button>
                        </div>
                      </div>

                      {recentSellers.length ? (
                        <div className="admin-recent-list">
                          {recentSellers.map((seller) => (
                            <RecentSellerItem
                              key={seller._id}
                              seller={seller}
                              onOpen={() => setActiveSection("sellers")}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="admin-empty-state">No seller records yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

        {activeSection === "people" ? (
        <TableCard title="People Directory" subtitle="All buyers, sellers, delivery partners, and admin accounts.">
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone / Shop</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {peopleRows.length ? peopleRows.map((user) => {
                  const rowKey = `delete:user:${user._id}`;
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="fw-semibold">{user.shopName || user.name || "Unknown"}</div>
                        {user.shopName ? <div className="text-muted small">{user.name}</div> : null}
                      </td>
                      <td>{user.roleLabel}</td>
                      <td>{user.email || "No email"}</td>
                      <td>{user.shopName ? `${user.phone || "No phone"} / ${user.shopName}` : (user.phone || "No phone")}</td>
                      <td><StatusPill status={user.approvalStatus || "approved"} /></td>
                      <td>
                        <ActionButtons
                          busy={busyKey === rowKey}
                          onDelete={() => handleDelete("user", user._id, `${user.roleLabel.toLowerCase()} account`)}
                          disableDelete={user.role === "admin"}
                        />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
        ) : null}

        {activeSection === "sellers" ? (
        <TableCard title="Seller Approvals" subtitle="Approve, reject, or delete seller registrations.">
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.length ? sellers.map((seller) => {
                  const decisionKey = `seller:${seller._id}`;
                  const deleteKey = `delete:user:${seller._id}`;
                  return (
                    <tr key={seller._id}>
                      <td>
                        <div className="fw-semibold">{seller.shopName || seller.name}</div>
                        <div className="text-muted small">{seller.name}</div>
                      </td>
                      <td>{seller.email}</td>
                      <td>{seller.phone || "No phone"}</td>
                      <td><StatusPill status={seller.approvalStatus} /></td>
                      <td style={{ minWidth: 220 }}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={notes[decisionKey] ?? seller.approvalNote ?? ""}
                          onChange={(event) => setNote(decisionKey, event.target.value)}
                          placeholder="Optional review note"
                        />
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <ActionButtons
                            busy={busyKey === decisionKey || busyKey === deleteKey}
                            onApprove={seller.approvalStatus !== "approved" ? () => handleDecision("seller", seller._id, "approved") : undefined}
                            onReject={seller.approvalStatus !== "approved" ? () => handleDecision("seller", seller._id, "rejected") : undefined}
                            onDelete={() => handleDelete("user", seller._id, "seller account")}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm"
                            onClick={() => {
                              setSelectedSeller(seller);
                              setActiveSection("products");
                            }}
                          >
                            View Products
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">No seller registrations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
        ) : null}

        {activeSection === "products" ? (
        <TableCard
          title={selectedSeller ? `Products from ${selectedSeller.shopName || selectedSeller.name}` : "Product Reviews"}
          subtitle={selectedSeller ? "Review all products submitted by this seller." : "Approve, reject, or remove product submissions before they go live."}
          actions={selectedSeller ? (
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={clearSellerProductFilter}>
              Clear seller filter
            </button>
          ) : null}
        >
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length ? filteredProducts.map((product) => {
                  const decisionKey = `product:${product._id}`;
                  const deleteKey = `delete:product:${product._id}`;
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="rounded"
                              style={{ width: 48, height: 48, objectFit: "cover" }}
                            />
                          ) : null}
                          <div>
                            <div className="fw-semibold">{product.name}</div>
                            <div className="text-muted small">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td>{product.sellerId?.shopName || product.sellerId?.name || "Seller"}</td>
                      <td>Rs {product.price || 0}</td>
                      <td>{product.stockQuantity || 0}</td>
                      <td><StatusPill status={product.approvalStatus} /></td>
                      <td style={{ minWidth: 220 }}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={notes[decisionKey] ?? product.approvalNote ?? ""}
                          onChange={(event) => setNote(decisionKey, event.target.value)}
                          placeholder="Optional review note"
                        />
                      </td>
                      <td>
                        <ActionButtons
                          busy={busyKey === decisionKey || busyKey === deleteKey}
                          onApprove={product.approvalStatus !== "approved" ? () => handleDecision("product", product._id, "approved") : undefined}
                          onReject={product.approvalStatus !== "approved" ? () => handleDecision("product", product._id, "rejected") : undefined}
                          onDelete={() => handleDelete("product", product._id, "product")}
                        />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No products available for review.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
        ) : null}

        {activeSection === "delivery" ? (
        <TableCard title="Delivery Partner Checks" subtitle="Review KYC applications and remove records when needed.">
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Contact</th>
                  <th>Documents</th>
                  <th>Bank</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryApplications.length ? deliveryApplications.map((application) => {
                  const decisionKey = `delivery:${application._id}`;
                  const deleteKey = `delete:delivery:${application._id}`;
                  return (
                    <tr key={application._id}>
                      <td>
                        <div className="fw-semibold">{application.name || application.applicant?.name || "Delivery Partner"}</div>
                        <div className="text-muted small">Vehicle: {application.vehicleNumber || "N/A"}</div>
                      </td>
                      <td>
                        <div>{application.email || application.applicant?.email || "No email"}</div>
                        <div className="text-muted small">{application.phone || application.applicant?.phone || "No phone"}</div>
                      </td>
                      <td>
                        <div className="small">Aadhaar: {application.aadhaarNumber || "N/A"}</div>
                        <div className="small">License: {application.licenseNumber || "N/A"}</div>
                        {application.aadhaarUrl ? <div className="small"><a href={application.aadhaarUrl} target="_blank" rel="noreferrer">Aadhaar file</a></div> : null}
                        {application.licenseUrl ? <div className="small"><a href={application.licenseUrl} target="_blank" rel="noreferrer">License file</a></div> : null}
                        {application.selfieUrl ? <div className="small"><a href={application.selfieUrl} target="_blank" rel="noreferrer">Selfie file</a></div> : null}
                      </td>
                      <td>{application.bank?.account || "N/A"} / {application.bank?.ifsc || "N/A"}</td>
                      <td><StatusPill status={application.status} /></td>
                      <td style={{ minWidth: 220 }}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={notes[decisionKey] ?? application.reviewNote ?? ""}
                          onChange={(event) => setNote(decisionKey, event.target.value)}
                          placeholder="Optional review note"
                        />
                      </td>
                      <td>
                        <ActionButtons
                          busy={busyKey === decisionKey || busyKey === deleteKey}
                          onApprove={application.status !== "approved" ? () => handleDecision("delivery", application._id, "approved") : undefined}
                          onReject={application.status !== "approved" ? () => handleDecision("delivery", application._id, "rejected") : undefined}
                          onDelete={() => handleDelete("delivery", application._id, "delivery application")}
                        />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No delivery applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
        ) : null}

        {activeSection === "orders" ? (
        <TableCard title="Pending Orders" subtitle="Review and approve orders from buyers.">
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle mb-0 admin-data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length ? pendingOrders.map((order) => {
                  const decisionKey = `order:${order._id}`;
                  const buyerName = order.buyerId?.name || "Unknown";
                  const sellerName = order.sellerId?.shopName || order.sellerId?.name || "Unknown";
                  const itemCount = order.items?.length || 0;
                  return (
                    <tr key={order._id}>
                      <td>
                        <div className="fw-semibold">{order._id.slice(-8).toUpperCase()}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{buyerName}</div>
                        <div className="text-muted small">{order.buyerId?.email || "No email"}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{sellerName}</div>
                        <div className="text-muted small">{order.sellerId?.email || "No email"}</div>
                      </td>
                      <td>
                        <div className="small">{itemCount} item(s)</div>
                        {order.items?.[0]?.name ? <div className="text-muted small">{order.items[0].name}</div> : null}
                      </td>
                      <td>
                        <div className="fw-semibold">₹{order.totalAmount || 0}</div>
                      </td>
                      <td><StatusPill status="pending" /></td>
                      <td>
                        <ActionButtons
                          busy={busyKey === decisionKey}
                          onApprove={() => handleDecision("order", order._id, "approved")}
                          onReject={() => handleDecision("order", order._id, "rejected")}
                          disableDelete
                        />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No pending orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
        ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
