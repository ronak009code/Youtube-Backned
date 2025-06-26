import { ApiError } from "../utills/apiError.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../Models/user.models.js";


// create  a middleware to verify JWT token
export const verifyJWT = asyncHandler(async (req ,res ,next) => {
  try {
     const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
  
     if(!token){
        throw new ApiError(401, "Unauthorized request")
     }
      
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
    const user =  await User.findById(decodedToken?._id).select("-password -refreshToken")
  
     if (!user) {   
        throw new ApiError(401,"Invalid Access Token");
     }
  
     req.user = user;
     next();
  
  } catch (error) {
     throw new ApiError(401, error?.message || "Inavlid Access Token");
  }
  
})