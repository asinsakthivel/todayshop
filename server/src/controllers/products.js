import Category from "../models/Category.js";
import Product from "../models/Product.js";

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCategoryRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

const findCategoryByValue = async (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;

  return Category.findOne({
    isActive: true,
    $or: [
      { name: normalized },
      { displayName: exactCategoryRegex(value) }
    ]
  }).select("_id name");
};

const collectDescendantCategoryNames = async (rootCategory) => {
  const names = new Set([rootCategory.name]);
  const queue = [rootCategory._id];

  while (queue.length) {
    const parentIds = queue.splice(0, queue.length);
    const children = await Category.find({
      isActive: true,
      parent: { $in: parentIds }
    }).select("_id name");

    children.forEach((child) => {
      names.add(child.name);
      queue.push(child._id);
    });
  }

  return Array.from(names);
};

const buildCategoryFilter = async (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;

  const matchedCategory = await findCategoryByValue(rawValue);
  if (!matchedCategory) {
    return exactCategoryRegex(rawValue);
  }

  const categoryNames = await collectDescendantCategoryNames(matchedCategory);
  return {
    $in: categoryNames.map((categoryName) => exactCategoryRegex(categoryName))
  };
};

export const listProducts = async (req, res) => {
  const { q, category, sellerOnly } = req.query;
  const filter = {};

  if (q) filter.name = { $regex: q, $options: "i" };
  if (category) {
    const categoryFilter = await buildCategoryFilter(category);
    if (categoryFilter) filter.category = categoryFilter;
  }
  if (String(sellerOnly).toLowerCase() === "true") {
    filter.seller = { $exists: true, $ne: null };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
};

export const listMyProducts = async (req, res) => {
  const { q, category } = req.query;
  const filter = { seller: req.user.id };

  if (q) filter.name = { $regex: q, $options: "i" };
  if (category) {
    const categoryFilter = await buildCategoryFilter(category);
    if (categoryFilter) filter.category = categoryFilter;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
};

export const createProduct = async (req, res) => {
  const payload = { ...req.body, seller: req.user.id };
  const product = await Product.create(payload);
  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id },
    req.body,
    { new: true }
  );
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
};
