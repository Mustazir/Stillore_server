import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://codecrafters1125_db_user:XPEG8fymAjcXYomG@cluster0.4a2offu.mongodb.net/Stilore?retryWrites=true&w=majority"
    );
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
};
