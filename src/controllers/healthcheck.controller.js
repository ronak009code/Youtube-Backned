import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/apiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { Tweet } from "../Models/tweet.model.js";
import { User } from "../Models/user.models.js";
import mongoose,{ isValidObjectId} from "mongoose";

const healthcheck = asyncHandler( async (req,res) => {
    return res
    .status(201)
    .json(new ApiResponse(200, { message: "Everything is o.k" },"OK"));
})

export { healthcheck }