import mongoose from "mongoose";

const { Schema } = mongoose;

// Education Schema
const educationSchema = new Schema({
  school: { type: String, default: "" },
  degree: { type: String, default: "" },
  fieldOfStudy: { type: String, default: "" },
});

// Work Schema
const workSchema = new Schema({
  company: { type: String, default: "" },
  position: { type: String, default: "" },
  years: { type: Number, default: "" },
});

// Profile Schema
const profileSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bio: { type: String, default: "" },
  currentPost: { type: String, default: "" },
  pastWork: { type: [workSchema], default: [] },
  education: { type: [educationSchema], default: [] },
});

export default mongoose.model("Profile", profileSchema);
