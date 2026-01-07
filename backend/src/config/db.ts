import mongoose from "mongoose";

export const DBconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("✅ DB connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
};
