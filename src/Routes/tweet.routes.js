import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweets
} from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT,upload.none());//  route handles only text fields and does not expect any file uploads.


router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;