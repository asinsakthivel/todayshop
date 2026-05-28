const AddressCard = ({ address, onSelect, selected }) => (
  <div
    className={`address-card p-3 mb-3 ${selected ? "selected" : ""}`}
    role="button"
    onClick={() => onSelect?.(address)}
  >
    <div className="d-flex justify-content-between align-items-center gap-2">
      <div className="fw-semibold d-flex align-items-center gap-2">
        <i className="bi bi-geo-alt text-muted" />
        {address.label}
      </div>
      {address.isDefault ? <span className="badge default-badge">Default</span> : null}
    </div>
    <div className="text-muted small mt-2">
      {address.street}, {address.city}, {address.state} - {address.pincode}
    </div>
  </div>
);

export default AddressCard;
