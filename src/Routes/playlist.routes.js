import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToplaylist,
    removeVideoFromplaylist,
    getPlaylistById,
    getUserPlylists
} from "../controllers/playlist.controller.js"

const router = Router();

router.use(verifyJWT,upload.none()) // Aplly verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist);

router
      .route("/:playlistId")
      .get(getPlaylistById)
      .patch(updatePlaylist)
      .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToplaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromplaylist);

router.route("/user/:userId").get(getUserPlylists);

export default router;