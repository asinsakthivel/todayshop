import dotenv from "dotenv";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/todayshop";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleFile = path.join(__dirname, "products-sample.json");

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${MONGO_URI}`);

    const rawData = await readFile(sampleFile, "utf8");
    const sampleProducts = JSON.parse(rawData);

    await Product.insertMany(sampleProducts);
    console.log("Sample products inserted successfully.");
  } catch (error) {
    console.error("Failed to seed products:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
