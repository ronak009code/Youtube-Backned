import { Router } from "express";
import {
   getSubscriberChannels,
   getUserChannelSubscribers,
   toggleSubscription
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // apply verifyJWT middleware to all routes in this file

router
.route("/c/:channelId")
.get(getUserChannelSubscribers)
.post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscriberChannels);

export default router;