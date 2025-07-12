import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    deleteVideo,
    updateVideo,
    publishVideo,
    getVideoById,
    togglePublishStatus
} from "../controllers/video.controller.js"

const router = Router();

// add router for get and publish videos
router
.route("/")
.get(getAllVideos)
.post(
    verifyJwt,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishVideo
);

// add router for getvideo,deletevideo and updatevideo details
router
.route("/v/:videoId")
.get(verifyJwt,getVideoById)
.delete(verifyJwt,deleteVideo)
.patch(verifyJwt,upload.single("thumbnail"),updateVideo);

// add router for toggle videos
router.route("/toggle/publish/:videoId").patch(verifyJwt,togglePublishStatus);

export default router;