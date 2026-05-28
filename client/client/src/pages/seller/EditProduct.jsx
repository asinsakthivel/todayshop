import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios.js";
import { notifyProductFeedUpdated } from "../../lib/productFeedSync.js";

const EditProduct = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data } = await api.get(`/seller/products/${id}`);
      setForm({
        ...data,
        costPrice: data.costPrice || "",
        imageUrls: data.images?.join("\n") || ""
      });
    } catch (error) {
      console.error(error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data || []);
    } catch {
      setCategories([]);
    }
  };

  const onFileSelect = (incomingFiles) => {
    setFiles(Array.from(incomingFiles || []).slice(0, 8));
  };

  const submit = async (e) => {
    e.preventDefault();

    const fd = new FormData();

    [
      "name",
      "description",
      "price",
      "costPrice",
      "category",
      "stockQuantity",
      "imageUrls"
    ].forEach((field) => {
      fd.append(field, form[field] ?? "");
    });

    files.forEach((file) => fd.append("images", file));

    try {
      await api.put(`/seller/products/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      notifyProductFeedUpdated();
      navigate("/seller/products", { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  if (!form) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: "800px" }}>
      <h4 className="mb-4">Edit Product</h4>

      <form className="card shadow-sm border-0 p-4" onSubmit={submit}>
        {/* Shop Name */}
        <div className="mb-3">
          <label className="form-label">Shop Name</label>
          <input
            className="form-control"
            value={
              form.shopName ||
              form.sellerId?.shopName ||
              form.sellerId?.name ||
              ""
            }
            disabled
            readOnly
          />
        </div>

        {/* Product Fields */}
        {["name", "description", "price", "costPrice", "stockQuantity"].map(
          (field) => (
            <div className="mb-3" key={field}>
              <label className="form-label">
                {field === "stockQuantity"
                  ? "Stock Quantity"
                  : field === "costPrice"
                  ? "Cost Price"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>

              <input
                className="form-control"
                type={
                  ["price", "costPrice", "stockQuantity"].includes(field)
                    ? "number"
                    : "text"
                }
                value={form[field] || ""}
                onChange={(e) =>
                  setForm({ ...form, [field]: e.target.value })
                }
                required
              />
            </div>
          )
        )}

        {/* Category */}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.category || ""}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            required
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.parent?.displayName
                  ? `${cat.parent.displayName} / ${cat.displayName}`
                  : cat.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Image URLs */}
        <div className="mb-3">
          <label className="form-label">Image URLs</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.imageUrls}
            onChange={(e) =>
              setForm({ ...form, imageUrls: e.target.value })
            }
            placeholder="https://..."
          />
        </div>

        {/* Existing Images */}
        <div className="mb-3">
          <label className="form-label">Existing Images</label>
          <div className="d-flex gap-2 flex-wrap">
            {form.images?.length ? (
              form.images.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`product-${index}`}
                  className="rounded border"
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover"
                  }}
                />
              ))
            ) : (
              <div className="text-muted">No images available</div>
            )}
          </div>
        </div>

        {/* Upload New Images */}
        <div className="mb-4">
          <label className="form-label">Upload New Images</label>
          <input
            className="form-control"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => onFileSelect(e.target.files)}
          />
        </div>

        {/* Preview New Images */}
        {files.length > 0 && (
          <div className="mb-4">
            <label className="form-label">New Image Preview</label>
            <div className="d-flex gap-2 flex-wrap">
              {files.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="rounded border"
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover"
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary w-100" type="submit">
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
