import { Router } from "express";
import {
    addComment,
    deleteComment,
    updateComment,
    getVideoComments
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT,upload.none()); //  route handles only text fields and does not expect any file uploads.


router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);


export default router;