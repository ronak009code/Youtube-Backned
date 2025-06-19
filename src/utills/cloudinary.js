import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.cloudinary_cloud_name, 
        api_key: process.env.cloudinary_api_key, 
        api_secret: process.env.cloudinary_api_secret
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
        console.log("file is uploaded on cloudinary");
        console.log(response);
        console.log(response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localfilePath) //remove the locally saved temporary file got failed
    }

}
export { uploadonCloudinary }