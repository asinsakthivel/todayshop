import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios.js";

const BuyerReviewModal = ({
  order,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const submitReview = async () => {
    try {
      setLoading(true);

      await api.post(`/reviews/${order._id}`, {
        rating,
        comment
      });

      toast.success("Review submitted successfully");

      if (onSubmitted) {
        await onSubmitted(order._id);
      }

      setComment("");
      setRating(5);
      onClose();

    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        "Could not submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content border-0 shadow">

          <div className="modal-header">
            <h5 className="modal-title">Write Review</h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">

            <p>
              <strong>Order ID:</strong> {order._id}
            </p>

            <p>
              <strong>Price:</strong> ₹
              {order.totalAmount || order.items?.[0]?.price || 0}
            </p>

            <div className="mb-3">
              <label className="form-label">Rating</label>

              <select
                className="form-select"
                value={rating}
                onChange={(e) =>
                  setRating(Number(e.target.value))
                }
              >
                <option value={5}>5 ⭐</option>
                <option value={4}>4 ⭐</option>
                <option value={3}>3 ⭐</option>
                <option value={2}>2 ⭐</option>
                <option value={1}>1 ⭐</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Comment</label>

              <textarea
                className="form-control"
                rows="4"
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
              />
            </div>

          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={submitReview}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BuyerReviewModal;