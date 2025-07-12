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




// http://localhost:5000/api/v1/users/register


//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)





export { app }