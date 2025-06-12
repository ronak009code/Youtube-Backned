import connectDB from "./DB/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";
dotenv.config({
    path :'./.env'
});

//connecting database
connectDB()
.then(() => {
   app.listen(process.env.PORT || 5000, () => {
          console.log(`server is running on port ${process.env.PORT}`);
   })
    app.on("error",(error) => {
        console.log("Error detected",error);
        throw error;
    })
})
.catch((err) => {
    console.log("MONGO db connection failed", err);
});




/*
import express from 'express';
const app= express();

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/
            ${DB_NAME}`)
            app.on("error",(error) => {
                console.log("error",error);
                throw error;
            })

            app.listen(process.env.PORT,() => {
                console.log(`App is Listening on port $
                    {process.env.PORT}`);
            })
    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
})()
    */