import connectDB from "./DB/index.js";

import dotenv from "dotenv";
dotenv.config({
    path :'./.env'
});

connectDB()
.then(() => {
    //optionally write by me
    app.on("error",(error) => {
        console.log("Error detected",error);
        throw error;
    })
   app.listen(process.env.PORT || 5000, () => {
          console.log(`server is running on port $
            {process.env.PORT}`);
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