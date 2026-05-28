import Review from "../models/Review.js";
import Order from "../models/Order.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow review after delivery
    const normalizeStatus = (s) => String(s || "").toUpperCase();
    if (normalizeStatus(order.orderStatus) !== "DELIVERED") {
      return res.status(400).json({ error: "Order must be delivered to review" });
    }

    // Only allow one review per order
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ error: "Review already submitted" });
    }

    const review = await Review.create({
      orderId,
      buyerId,
      sellerId: order.sellerId,
      deliveryPartnerId: order.deliveryPartnerId,
      productId: order.productId,
      rating,
      comment
    });

    // Update order review flags (keep backward compatibility)
    order.reviewSubmitted = true;
    order.reviewed = {
      ...(order.reviewed || {}),
      seller: true
    };
    await order.save();

    // Emit socket event to seller room
    const io = req.app.get("io");
    const sellerId = order.sellerId?.toString();
    const reviewData = {
      orderId: order._id,
      buyerId,
      sellerId,
      rating,
      comment,
      createdAt: review.createdAt
    };

    if (io && sellerId) {
      io.to(sellerId).emit("newReview", reviewData);
    }

    return res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create review" });
  }
};

export const getSellerReviews = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const reviews = await Review.find({ sellerId })
      .populate("buyerId", "name")
      .populate("orderId")
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDeliveryReviews = async (req, res) => {
  try {
    const deliveryPartnerId = req.user.id;
    const reviews = await Review.find({ deliveryPartnerId })
      .populate("buyerId")
      .populate("orderId")
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getProductCustomerReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .populate("buyerId", "name")
      .sort({ createdAt: -1 });

    const mapped = reviews.map((r) => ({
      _id: r._id,
      buyerId: r.buyerId?._id,
      customerName: r.buyerId?.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      date: r.createdAt
    }));

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


