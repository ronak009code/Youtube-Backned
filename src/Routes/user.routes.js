import { Router } from "express";
import { 
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser ,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
 } from "../controllers/user.controller.js";

import {upload} from "..//middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// Create route for a register user
router.route("/register").post(
  upload.fields([
   {
    name : "avatar",
    maxcount : 1
   },
   {
     name : "CoverImage",
     maxcount : 1
   }
  ]),
    registerUser
);

// Create route for a login user
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)

// Create route for a refresh token 
router.route("/refresh-token").post(refreshAccessToken)

// Create route for a change password
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

// Create route for a get current user
router.route("/current-user").get(verifyJWT,getCurrentUser)

// Create route for a update account details
router.route("/updateaccount-details").patch(verifyJWT,updateAccountDetails)

// Create route for a update user avatar and cover image
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar)

// Create route for a update user cover image
router.route("/update-coverimage").patch(verifyJWT,upload.single("CoverImage"),
updateUserCoverImage)

// Create route for a get user channel profile
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

// Create route for a get watch history
router.route("/watch-history").get(verifyJWT,getWatchHistory)



export default router;