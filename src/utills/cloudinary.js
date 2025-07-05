import "dotenv/config";
import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiError.js";

      
    // Configuration
    cloudinary.config({ 
        cloud_name : process.env.CLOUDINARY_CLOUD_NAME, 
        api_key : process.env.CLOUDINARY_API_KEY, 
        api_secret : process.env.CLOUDINARY_API_SECRET
    });
 
    //function to upload file on cloudinary with conditions
const uploadonCloudinary = async (localfilePath) => {
    try {
        if(!localfilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {  
            resource_type : "auto"
        })
        //file has been upload succesfully
        // console.log("file is uploaded on cloudinary");
        // console.log(response);
        fs.unlinkSync(localfilePath);
        return response
    } catch (error) {
         console.log("Error while uploading",error);
          fs.unlinkSync(localfilePath) //remove the locally saved temporary file got failed
          return null;
    }
}

const deleteOnCloudinary = async(public_id,resource_type="image") =>{
    try {
        if (!public_id) return null

        //delete from cloudinary
        const result = await cloudinary.uploader.destroy(public_id,{
            resource_type:`${resource_type}`
        });
            
    } catch (error) {
        throw new ApiError(400,"something wrong while deleting the old avatar")
    }
}
export {
     uploadonCloudinary,
     deleteOnCloudinary
     }