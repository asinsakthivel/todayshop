import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios.js";
import { useNavigate } from "react-router-dom";
import { notifyProductFeedUpdated } from "../../lib/productFeedSync.js";
import ProductCard from "../../components/ProductCard.jsx";
import { toast } from "react-toastify";

const initialForm = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  category: "",
  stockQuantity: "",
  unit: "",
  tags: ""
};

const AddProduct = ({ embedded = false, onPublished }) => {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [seller, setSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/seller/profile").then(({ data }) => setSeller(data));
    api.get("/categories")
      .then(({ data }) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  const imagePreviews = useMemo(
    () => files.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    })),
    [files]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) =>
        URL.revokeObjectURL(item.url)
      );
    };
  }, [imagePreviews]);

  const onFileSelect = (incomingFiles) => {
    const next = Array.from(incomingFiles || []).slice(0, 8);
    setFiles(next);
  };

  const submit = async (e) => {
    e.preventDefault();

    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      fd.append(key, value);
    });

    files.forEach((file) => fd.append("images", file));

    setSubmitting(true);

    try {
      const { data } = await api.post(
        "/seller/products",
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      notifyProductFeedUpdated();
      toast.success("Product published successfully");

      setForm(initialForm);
      setFiles([]);
      setPreviewVisible(false);

      onPublished?.(data);

      if (!embedded) {
        navigate("/seller/products", {
          replace: true
        });
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to publish product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewProduct = {
    _id: "preview-product",
    name: form.name || "Fresh Farm Tomatoes",
    description:
      form.description ||
      "Crisp, fresh, and ready for buyers.",
    price: Number(form.price) || 120,
    costPrice: Number(form.costPrice) || 80,
    category: form.category || "Produce",
    images: imagePreviews.map((item) => item.url),
    sellerId: {
      shopName: seller?.shopName || "Your Shop",
      name: seller?.name || "Seller"
    }
  };

  return (
    <div className={embedded ? "" : "container py-4"}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Upload Product</h3>
          <p className="text-muted mb-0">
            Add product details and preview before publishing.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() =>
            setPreviewVisible(!previewVisible)
          }
        >
          {previewVisible
            ? "Hide Preview"
            : "Preview"}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <form
            className="card shadow-sm border-0"
            onSubmit={submit}
          >
            <div className="card-body p-4">
              <div className="row g-3">

                {[
                  "name",
                  "price",
                  "costPrice",
                  "stockQuantity",
                  "unit",
                  "tags"
                ].map((field) => (
                  <div
                    key={field}
                    className={
                      field === "name" ||
                      field === "tags"
                        ? "col-12"
                        : "col-md-6"
                    }
                  >
                    <label className="form-label">
                      {field === "stockQuantity"
                        ? "Stock Quantity"
                        : field === "costPrice"
                        ? "Cost Price"
                        : field
                            .charAt(0)
                            .toUpperCase() +
                          field.slice(1)}
                    </label>

                    <input
                      className="form-control"
                      type={
                        [
                          "price",
                          "costPrice",
                          "stockQuantity"
                        ].includes(field)
                          ? "number"
                          : "text"
                      }
                      value={form[field]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [field]:
                            e.target.value
                        })
                      }
                      required={
                        !["unit", "tags"].includes(
                          field
                        )
                      }
                    />
                  </div>
                ))}

                <div className="col-md-6">
                  <label className="form-label">
                    Category
                  </label>

                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Category
                    </option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.displayName}>
                          {cat.displayName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Shop Name
                  </label>

                  <input
                    className="form-control"
                    value={
                      seller?.shopName ||
                      seller?.name ||
                      ""
                    }
                    disabled
                    readOnly
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows="4"
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value
                      })
                    }
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Upload Images
                  </label>

                  <input
                    className="form-control"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      onFileSelect(
                        e.target.files
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="card-footer bg-white border-0 p-4 pt-0 d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setPreviewVisible(true)
                }
              >
                Preview
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Publishing..."
                  : "Publish Product"}
              </button>
            </div>
          </form>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h5>Buyer Preview</h5>

              {previewVisible ? (
                <ProductCard
                  product={
                    previewProduct
                  }
                  previewMode
                />
              ) : (
                <div className="text-muted text-center py-5">
                  Click Preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
