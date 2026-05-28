import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { ensureCartIndexes } from "./models/Cart.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import buyerRoutes from "./routes/buyer.js";
import sellerRoutes from "./routes/seller.js";
import deliveryRoutes from "./routes/delivery.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import ordersApiRoutes from "./routes/ordersApi.js";
import systemRoutes from "./routes/system.js";
import reviewRoutes from "./routes/reviews.js";
import categoryRoutes from "./routes/categories.js";
import notificationRoutes from "./routes/notifications.js";


dotenv.config();
await connectDB();
await ensureCartIndexes();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true } });
const userSockets = new Map();

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
  });
  socket.on("disconnect", () => {
    for (const [key, value] of userSockets.entries()) {
      if (value === socket.id) userSockets.delete(key);
    }
  });
});

app.set("io", io);
app.set("userSockets", userSockets);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/orders", ordersApiRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);


app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(clientIndexPath);
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).send("Today Shop API is running. Build or run the frontend to use the app UI.");
  });
}

app.use((err, _req, res, _next) => {
  if (!err) {
    return res.status(500).json({ message: "Unknown server error" });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message || "File upload failed" });
  }

  if (err.message?.toLowerCase?.().includes("multipart")) {
    return res.status(400).json({ message: "Upload request was incomplete. Please choose the files again and resubmit." });
  }

  return res.status(500).json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`API running on ${port}`));
