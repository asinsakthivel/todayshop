import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization || "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authorization token missing" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const verifyToken = protect;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

