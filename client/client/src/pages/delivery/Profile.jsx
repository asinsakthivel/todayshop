import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";

const InfoRow = ({ label, value }) => (
  <div className="d-flex justify-content-between align-items-start gap-3 py-2 border-bottom">
    <span className="text-muted">{label}</span>
    <span className="fw-semibold text-end">{value || "Not provided"}</span>
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/delivery/profile").then(({ data }) => setProfile(data));
  }, []);

  if (!profile) return <div className="container py-4">Loading...</div>;

  const kyc = profile.application ? {
    basicDetails: {
      name: profile.application.name || profile.name,
      phone: profile.application.phone || profile.phone,
      email: profile.application.email || profile.email
    },
    verificationDetails: {
      aadhaarNumber: profile.application.aadhaarNumber,
      licenseNumber: profile.application.licenseNumber,
      vehicleNumber: profile.application.vehicleNumber
    },
    bankDetails: {
      accountNumber: profile.application.bank?.account,
      ifsc: profile.application.bank?.ifsc
    },
    documents: {
      aadhaarPhoto: profile.application.aadhaarUrl,
      licensePhoto: profile.application.licenseUrl,
      selfie: profile.application.selfieUrl
    },
    verificationStatus: profile.application.status,
    submittedAt: profile.application.updatedAt
  } : null;

  if (!kyc) {
    return (
      <div className="container py-3" style={{ maxWidth: "920px" }}>
        <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>Your KYC details are not submitted yet. Complete them once and they will be saved in MongoDB and shown here automatically.</div>
          <Link className="btn btn-dark btn-sm" to="/delivery/kyc">Complete KYC</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-2" style={{ maxWidth: "1100px" }}>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <span className={`badge ${kyc.verificationStatus === "approved" ? "text-bg-success" : kyc.verificationStatus === "rejected" ? "text-bg-danger" : "text-bg-warning"}`}>{kyc.verificationStatus || "pending"}</span>
          <h3 className="mb-1">Delivery Partner Profile</h3>
          <p className="text-muted mb-0">Your KYC, bank details, and verification documents are loaded from the backend delivery applications collection.</p>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3 px-4">
            <div className="text-muted small">Completed deliveries</div>
            <div className="h4 mb-0">{profile.deliveries || 0}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="mb-3">Basic Details</h5>
              <InfoRow label="Name" value={kyc.basicDetails?.name || profile.name} />
              <InfoRow label="Phone" value={kyc.basicDetails?.phone || profile.phone} />
              <InfoRow label="Email" value={kyc.basicDetails?.email || profile.email} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="mb-3">Verification Details</h5>
              <InfoRow label="Aadhaar Number" value={kyc.verificationDetails?.aadhaarNumber} />
              <InfoRow label="License Number" value={kyc.verificationDetails?.licenseNumber} />
              <InfoRow label="Vehicle Number" value={kyc.verificationDetails?.vehicleNumber} />
              <InfoRow label="Status" value={kyc.verificationStatus || "Verified"} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="mb-3">Bank Details</h5>
              <InfoRow label="Account Number" value={kyc.bankDetails?.accountNumber} />
              <InfoRow label="IFSC" value={kyc.bankDetails?.ifsc} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="mb-3">Uploaded Documents</h5>
              <div className="row g-3">
                {[
                  { label: "Aadhaar Photo Preview", value: kyc.documents?.aadhaarPhoto },
                  { label: "License Photo Preview", value: kyc.documents?.licensePhoto },
                  { label: "Selfie Preview", value: kyc.documents?.selfie }
                ].map((item) => (
                  <div className="col-md-4" key={item.label}>
                    <div className="border rounded-4 p-2 h-100 bg-light">
                      <div className="small fw-semibold mb-2">{item.label}</div>
                      {item.value ? (
                        <img src={item.value} alt={item.label} className="img-fluid rounded-3" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                      ) : (
                        <div className="text-muted small py-5 text-center">Not uploaded</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
