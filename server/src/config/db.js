import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/todayshop";

    if (!process.env.MONGO_URI) {
      console.warn("MONGO_URI not set. Falling back to local MongoDB");
    }

    await mongoose.connect(uri, {
      dbName: "todayshop"
    });

    console.log("Mongo connected ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
    process.exit(1); // stop server
  }
};

export default connectDB;