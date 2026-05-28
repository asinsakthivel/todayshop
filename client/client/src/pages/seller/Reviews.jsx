import { useEffect, useState } from "react";
import api from "../../api/axios.js";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  const loadReviews = async () => {
    try {
      const { data } = await api.get("/reviews/seller");
      setReviews(data || []);
    } catch (error) {
      console.error("Failed to load reviews", error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="container py-4">
      <h4 className="mb-4">Customer Reviews</h4>

      {reviews.length ? (
        reviews.map((review) => (
          <div
            key={review._id}
            className="card shadow-sm mb-3 border-0"
          >
            <div className="card-body">
              <div className="fw-semibold mb-1">
                {review.productId?.name || "Product"}
              </div>

              <div className="small text-muted mb-2">
                Buyer: {review.buyerId?.name || "Customer"}
              </div>

              <div className="text-warning mb-2">
                {"⭐".repeat(review.rating)}
              </div>

              <div>{review.comment}</div>

              <small className="text-muted">
                {new Date(
                  review.createdAt
                ).toLocaleString()}
              </small>
            </div>
          </div>
        ))
      ) : (
        <div className="text-muted">
          No customer reviews yet.
        </div>
      )}
    </div>
  );
};

export default Reviews;