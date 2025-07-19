import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "50kb"}))
app.use(express.urlencoded({extended:true,limit : '16kb'}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import  userRouter from "./Routes/user.routes.js";
import videoRouter from "./Routes/video.routes.js"
import commentRouter from "./Routes/comment.routes.js"
import likeRouter from "./Routes/like.routes.js";
import subscriptionRouter from "./Routes/subscription.routes.js";
import tweetRouter from "./Routes/tweet.routes.js";
import healthcheckRouter from "./Routes/healthcheck.routes.js"
import playlistRouter from "./Routes/playlist.routes.js"
import dashboardRouter from "./Routes/dashboard.routes.js";

// http://localhost:5000/api/v1/users/register


//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/dashboard",dashboardRouter)

export { app }