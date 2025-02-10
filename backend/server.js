// Import required modules
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(postRoutes);
app.use(userRoutes);
app.use(express.static("uploads"));

// Connect to MongoDB
const start = async () => {
  const connectDB = await mongoose.connect(
    "mongodb+srv://raushanraj8294ssm:raj%401234@cluster0.flfcb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  );
  app.listen(9000, () => {
    console.log("Server running on port 9000");
  });
};

start();
