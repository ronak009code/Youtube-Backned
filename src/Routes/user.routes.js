import { Router } from "express";
import { loginUser , logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";

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




export default router;