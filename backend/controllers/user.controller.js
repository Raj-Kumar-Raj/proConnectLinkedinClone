import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import ConnectionRequest from "../models/connections.model.js";
import exp from "constants";
import { profile } from "console";

const convertUSerDataToPDF = async (userData) => {
  const doc = new PDFDocument();
  const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
  const stream = fs.createWriteStream("uploads/" + outputPath);
  doc.pipe(stream);

  // Header Section: Profile Picture and Name
  if (userData.userId.profilePicture) {
    doc.image(`uploads/${userData.userId.profilePicture}`, {
      fit: [100, 100],
      align: "center",
      valign: "top",
    });
    doc.moveDown(3);
  }

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(userData.userId.name, { align: "center", margin: [0, 20, 0, 10] });
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(userData.userId.username, { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(userData.userId.email, {
      align: "center",
      link: `mailto:${userData.userId.email}`,
    })
    .moveDown(1);

  // Bio Section
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Bio", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(userData.bio || "N/A")
    .moveDown(1);

  // Current Position
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Current Position", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(userData.currentPost || "N/A")
    .moveDown(1);

  // Past Work Section
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Past Work Experience", { underline: true })
    .moveDown(0.5);

  if (userData.pastWork && userData.pastWork.length > 0) {
    userData.pastWork.forEach((work, index) => {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Company Name: ${work.company}`, { continued: true })
        .text(` | Position: ${work.position}`, { continued: true })
        .text(` | Years: ${work.years}`)
        .moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text("No past work experience available").moveDown(1);
  }

  // Footer Section
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Generated on " + new Date().toLocaleDateString(), {
      align: "center",
      margin: [0, 30, 0, 0],
    });

  doc.end();
  return outputPath;
};

export const register = async (req, res) => {
  const { name, email, password, username } = req.body;

  console.log(req.body);

  // Validate input fields
  if (!name || !email || !password || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });

    // Create a profile for the user
    const profile = new Profile({ userId: newUser._id });

    // Save the user and profile to the database
    await newUser.save();
    await profile.save();

    // Respond with success message
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne({ _id: user._id }, { token });
    return res.json({
      token: token,
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfilePicture = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token }); // Find the user by token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the file is present
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    user.profilePicture = req.file.filename;
    await user.save();

    return res.status(200).json({ message: "Profile picture updated" });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, email } = newUserData;
    let existingUsername = null; // Ensure existingUsername is declared

    if (username) {
      existingUsername = await User.findOne({
        $or: [{ username }, { email }],
      });
    }

    if (
      existingUsername &&
      existingUsername._id.toString() !== user._id.toString()
    ) {
      return res.status(400).json({ message: "Username already taken" });
    }

    Object.assign(user, newUserData);
    await user.save();

    return res.status(200).json({ message: "User profile updated" });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const profile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );

    return res.status(200).json({ user, profile });
  } catch (error) {
    console.error("Error getting user and profile:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const updatedProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;
    const userProfile = await User.findOne({ token: token });
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }
    const profile_to_update = await Profile.findOne({
      userId: userProfile._id,
    });
    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();
    return res.status(200).json({ message: "Profile updated" });
  } catch (error) {
    console.error("Error getting user and profile:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name username email profilePicture"
    );
    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("Error getting all users and profiles:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;
    const profile = await Profile.findOne({ userId: user_id }).populate(
      "userId",
      "name username email profilePicture"
    );

    let outputPath = await convertUSerDataToPDF(profile);
    return res.json({ message: outputPath });
  } catch (error) {
    console.error("Error downloading profile:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connectionUser = await User.findOne({ _id: connectionId });
    if (!connectionUser) {
      return res.status(404).json({ message: "Connection user not found" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Connection request already sent" });
    }

    const connection = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    await connection.save();
    return res.status(200).json({ message: "Connection request sent" });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const getMyConnectionsRequests = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const connection = await ConnectionRequest.find({
      userId: user._id,
    }).populate("connectionId", "name username email profilePicture");
    return res.status(200).json({ connection });
  } catch (error) {
    console.error("Error getting connection requests:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const whatAreMyConnections = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const connections = await ConnectionRequest.find({
      connectionId: user._id,
    }).populate("userId", "name username email profilePicture");
    return res.status(200).json(connections);
  } catch (error) {
    console.error("Error getting connections:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const request = await ConnectionRequest.findOne({ _id: requestId }); // Find the request by ID
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action_type === "accept") {
      request.status_accepted = true;
    } else {
      request.status_accepted = false;
    }

    await request.save();
    return res.status(200).json({ message: "Connection request accepted" });
  } catch (error) {
    console.error("Error accepting connection request:", error.mess);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
};

export const getUserProfileAndUserBasedOnUsername = async (req, res) => {
  const { username } = req.query;

  try {
    console.log("Fetching user:", username); // Debugging

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user profile and populate user details
    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );
    ` 1`;

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.status(200).json({ profile: userProfile });
  } catch (error) {
    console.error("Error getting user profile:", error.message);

    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      error: error.message, // Include this for debugging (remove in production)
    });
  }
};
