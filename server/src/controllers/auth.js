import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  shopName: user.shopName,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isVerified: user.isVerified,
  approvalStatus: user.approvalStatus || (user.role === "buyer" || user.role === "admin" || user.isVerified ? "approved" : "pending"),
  approvalNote: user.approvalNote || ""
});

export const register = async (req, res) => {
  try {
    const { name, shopName, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      shopName: role === "seller" ? (shopName || `${name}'s Store`) : undefined,
      email,
      password: passwordHash,
      role,
      phone,
      isVerified: role === "buyer" || role === "admin",
      approvalStatus: role === "buyer" ? "approved" : "pending"
    });
    if (role === "seller") {
      return res.status(201).json({
        requiresApproval: true,
        role: user.role,
        approvalStatus: user.approvalStatus,
        user: serializeUser(user),
        message: "Seller registration submitted. Please wait for admin approval before logging in."
      });
    }

    const token = signToken(user);
    res.status(201).json({ token, role: user.role, user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.password) {
      return res.status(400).json({ message: "Account has no password set, please register again or contact support to reset it." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "seller" && user.approvalStatus !== "approved") {
      const waitingMessage = user.approvalStatus === "rejected"
        ? "Your seller account was rejected by admin. Please contact support or update your registration."
        : "Your seller account is still waiting for admin approval.";
      return res.status(403).json({
        message: waitingMessage,
        approvalStatus: user.approvalStatus || "pending"
      });
    }

    const token = signToken(user);
    res.json({ token, role: user.role, user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};
