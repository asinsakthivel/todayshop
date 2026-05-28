import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { readDeliveryKyc, saveDeliveryKyc } from "../../lib/deliveryKyc.js";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  aadhaar: "",
  license: "",
  vehicle: "",
  account: "",
  ifsc: "",
  aadhaarPhoto: null,
  licensePhoto: null,
  selfie: null,
  aadhaarPhotoPreview: "",
  licensePhotoPreview: "",
  selfiePreview: ""
};

const normalizePreview = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("blob:")) return "";
  if (normalized.startsWith("data:")) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("/uploads/")) {
    return normalized;
  }
  return "";
};

const Kyc = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const userId = user?.id || user?._id;
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (user?.isVerified) {
      navigate("/delivery/dashboard", { replace: true });
    }
  }, [user?.isVerified, navigate]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const cached = readDeliveryKyc(userId);
      if (cached && active) {
        setForm((current) => ({
          ...current,
          name: cached?.basicDetails?.name || user?.name || "",
          phone: cached?.basicDetails?.phone || user?.phone || "",
          email: cached?.basicDetails?.email || user?.email || "",
          aadhaar: cached?.verificationDetails?.aadhaarNumber || "",
          license: cached?.verificationDetails?.licenseNumber || "",
          vehicle: cached?.verificationDetails?.vehicleNumber || "",
          account: cached?.bankDetails?.accountNumber || "",
          ifsc: cached?.bankDetails?.ifsc || "",
          aadhaarPhotoPreview: normalizePreview(cached?.documents?.aadhaarPhoto),
          licensePhotoPreview: normalizePreview(cached?.documents?.licensePhoto),
          selfiePreview: normalizePreview(cached?.documents?.selfie)
        }));
      }

      const { data } = await api.get("/delivery/application");
      if (!active || !data) return;

      const normalized = {
        basicDetails: {
          name: data.name || user?.name || "",
          phone: data.phone || user?.phone || "",
          email: data.email || user?.email || ""
        },
        verificationDetails: {
          aadhaarNumber: data.aadhaarNumber || "",
          licenseNumber: data.licenseNumber || "",
          vehicleNumber: data.vehicleNumber || ""
        },
        bankDetails: {
          accountNumber: data.bank?.account || "",
          ifsc: data.bank?.ifsc || ""
        },
        documents: {
          aadhaarPhoto: data.aadhaarUrl || "",
          licensePhoto: data.licenseUrl || "",
          selfie: data.selfieUrl || ""
        },
        verificationStatus: data.status || "pending",
        submittedAt: data.updatedAt
      };

      saveDeliveryKyc(userId, normalized);
      setForm((current) => ({
        ...current,
        name: normalized.basicDetails.name,
        phone: normalized.basicDetails.phone,
        email: normalized.basicDetails.email,
        aadhaar: normalized.verificationDetails.aadhaarNumber,
        license: normalized.verificationDetails.licenseNumber,
        vehicle: normalized.verificationDetails.vehicleNumber,
        account: normalized.bankDetails.accountNumber,
        ifsc: normalized.bankDetails.ifsc,
        aadhaarPhotoPreview: normalizePreview(normalized.documents.aadhaarPhoto),
        licensePhotoPreview: normalizePreview(normalized.documents.licensePhoto),
        selfiePreview: normalizePreview(normalized.documents.selfie)
      }));
    })();

    return () => {
      active = false;
    };
  }, [user?.email, user?.name, user?.phone, userId]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (files?.[0]) {
      const file = files[0];
      const previewField = `${name}Preview`;
      const objectUrl = URL.createObjectURL(file);
      setForm((current) => ({
        ...current,
        [name]: file,
        [previewField]: objectUrl
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        throw new Error("Please login again and try submitting KYC.");
      }

      const existingAadhaarUrl = form.aadhaarPhoto ? "" : normalizePreview(form.aadhaarPhotoPreview);
      const existingLicenseUrl = form.licensePhoto ? "" : normalizePreview(form.licensePhotoPreview);
      const existingSelfieUrl = form.selfie ? "" : normalizePreview(form.selfiePreview);

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("phone", form.phone);
      payload.append("email", form.email);
      payload.append("aadhaarNumber", form.aadhaar);
      payload.append("licenseNumber", form.license);
      payload.append("vehicleNumber", form.vehicle);
      payload.append("accountNumber", form.account);
      payload.append("ifsc", form.ifsc);
      payload.append("existingAadhaarUrl", existingAadhaarUrl);
      payload.append("existingLicenseUrl", existingLicenseUrl);
      payload.append("existingSelfieUrl", existingSelfieUrl);
      if (form.aadhaarPhoto) payload.append("aadhaarPhoto", form.aadhaarPhoto);
      if (form.licensePhoto) payload.append("licensePhoto", form.licensePhoto);
      if (form.selfie) payload.append("selfie", form.selfie);

      const response = await fetch(`${api.defaults.baseURL}/delivery/application`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "KYC submit failed. Please try again.");
      }

      saveDeliveryKyc(userId, {
        basicDetails: {
          name: form.name,
          phone: form.phone,
          email: form.email
        },
        verificationDetails: {
          aadhaarNumber: form.aadhaar,
          licenseNumber: form.license,
          vehicleNumber: form.vehicle
        },
        bankDetails: {
          accountNumber: form.account,
          ifsc: form.ifsc
        },
        documents: {
          aadhaarPhoto: data.aadhaarUrl || existingAadhaarUrl,
          licensePhoto: data.licenseUrl || existingLicenseUrl,
          selfie: data.selfieUrl || existingSelfieUrl
        },
        verificationStatus: data.status || "pending",
        submittedAt: data.updatedAt || new Date().toISOString()
      });

      setMessage("KYC submitted successfully. Redirecting to your profile.");
      window.setTimeout(() => navigate("/delivery/profile"), 700);
    } catch (submitError) {
      setError(submitError.message || "KYC submit failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-2" style={{ maxWidth: "900px" }}>
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-4 p-lg-5">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <span className="badge text-bg-dark mb-2">Delivery Partner</span>
              <h2 className="h3 mb-1">KYC Verification</h2>
              <p className="text-muted mb-0">Submit your details once and we will save them with your delivery profile.</p>
            </div>
            <div className="alert alert-info mb-0 py-2 px-3">
              Keep your phone, bank, and document details up to date for smooth pickups.
            </div>
          </div>

          {message ? <div className="alert alert-success">{message}</div> : null}
          {error ? <div className="alert alert-danger">{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h5 className="mb-3">Basic Details</h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input className="form-control" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h5 className="mb-3">Verification Details</h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input className="form-control" name="aadhaar" placeholder="Aadhaar Number" value={form.aadhaar} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control" name="license" placeholder="Driving License Number" value={form.license} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control" name="vehicle" placeholder="Vehicle Number" value={form.vehicle} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h5 className="mb-3">Bank Details</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input className="form-control" name="account" placeholder="Account Number" value={form.account} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <input className="form-control" name="ifsc" placeholder="IFSC Code" value={form.ifsc} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h5 className="mb-3">Uploaded Documents</h5>
                <div className="row g-4">
                  {[
                    { name: "aadhaarPhoto", label: "Aadhaar Photo", preview: form.aadhaarPhotoPreview },
                    { name: "licensePhoto", label: "License Photo", preview: form.licensePhotoPreview },
                    { name: "selfie", label: "Selfie", preview: form.selfiePreview }
                  ].map((item) => (
                    <div className="col-md-4" key={item.name}>
                      <label className="form-label fw-semibold">{item.label}</label>
                      <input className="form-control mb-3" type="file" name={item.name} accept="image/*" onChange={handleChange} required={!item.preview} />
                      <div className="border rounded-4 bg-white p-2 text-center">
                        {item.preview ? (
                          <img src={item.preview} alt={item.label} className="img-fluid rounded-3" style={{ maxHeight: "180px", objectFit: "cover", width: "100%" }} />
                        ) : (
                          <div className="text-muted small py-5">Preview will appear here</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-end">
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/delivery/dashboard")}>Skip To Dashboard</button>
              <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                {submitting ? "Saving..." : "Submit KYC"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Kyc;
