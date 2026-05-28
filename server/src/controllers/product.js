import Product from "../models/Product.js";
import Order from "../models/Order.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listProducts = async (req, res) => {
  const { q, category, min, max, minPrice, maxPrice, sort } = req.query;
  const filter = { isAvailable: true, approvalStatus: "approved" };
  const lowerBound = Number(minPrice ?? min ?? 0);
  const upperBound = Number(maxPrice ?? max ?? 0);
  const sortOption =
    sort === "low-high"
      ? { price: 1, createdAt: -1 }
      : sort === "high-low"
        ? { price: -1, createdAt: -1 }
        : { createdAt: -1 };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } }
    ];
  }

  if (category) {
    filter.category = {
      $regex: `^${escapeRegex(String(category).trim())}$`,
      $options: "i"
    };
  }

  if (lowerBound || upperBound) {
    filter.price = {
      ...(lowerBound ? { $gte: lowerBound } : {}),
      ...(upperBound ? { $lte: upperBound } : {})
    };
  }

  const products = await Product.find(filter)
    .populate("sellerId", "name shopName")
    .sort(sortOption);
  res.json(products);
};

export const getProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, approvalStatus: "approved" }).populate("sellerId", "name shopName");
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json(product);
};

export const addReview = async (req, res) => {
  const { id } = req.params;
  const { rating = 5, comment = "" } = req.body;
  const delivered = await Order.findOne({ buyerId: req.user.id, orderStatus: "delivered", "items.productId": id });
  if (!delivered) return res.status(400).json({ message: "Delivery not completed" });
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Not found" });
  if (product.reviews.some((review) => review.userId?.toString() === req.user.id)) {
    return res.status(400).json({ message: "You have already reviewed this product" });
  }
  product.reviews.push({ userId: req.user.id, rating, comment });
  product.reviewCount = product.reviews.length;
  product.avgRating = product.reviews.reduce((s, r) => s + (r.rating || 0), 0) / product.reviewCount;
  await product.save();
  res.status(201).json(product);
};
