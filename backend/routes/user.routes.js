import { Router } from "express";
import {
  register,
  login,
  updateProfilePicture,
  updateUserProfile,
  getUserAndProfile,
  updatedProfileData,
  getAllUserProfile,
  downloadProfile,
  sendConnectionRequest,
  getMyConnectionsRequests,
  whatAreMyConnections,
  acceptConnectionRequest,
  getUserProfileAndUserBasedOnUsername,
} from "../controllers/user.controller.js";
import multer from "multer";

const router = Router();

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to store files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original file name
  },
});

const upload = multer({ storage: storage });

router.route("/user_update").post(updateUserProfile);

// Route to update profile picture
router
  .route("/update_profile_picture")
  .post(upload.single("profile_Picture"), updateProfilePicture);

// Route for user registration
router.route("/register").post(register);

// Route for user login
router.route("/login").post(login);

router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updatedProfileData);
export default router;

router.route("/user/get_all_users").get(getAllUserProfile);
router.route("/user/download_resume").get(downloadProfile);

router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/getConnectionRequests").get(getMyConnectionsRequests);
router.route("/user/user_connection_request").get(whatAreMyConnections);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);
router
  .route("/user/get_profile_based_on_username")
  .get(getUserProfileAndUserBasedOnUsername);
