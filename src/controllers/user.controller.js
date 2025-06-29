import { asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/apiError.js';
import { User} from "../Models/user.models.js";
import { uploadonCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


//simple method for creating access and refresh token from User model
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()
        
        User.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false})
   
        return {accessToken, refreshToken};

    } catch (error) {
        console.log(error);
        
        throw new ApiError(500," Something Went Wrong While Generating Access and Refresh Token");
    }
}

// Function/Method to register a user
const registerUser = asyncHandler( async (req,res) => {

   // get user data from frontend
   // validation - not empty
   // check if user is already exists: username ,email
   // check for images ,avatar
   // upload them to cloudinary,avatar
   // create user object - create entry in database
   // remove password and refresh token field in response
   // check for user creation
   // return response to frontend



   // get user data from frontend
   const {fullName,email,username,password} = req.body
    
      //validation   check if field are not empty
      if (
        [fullName,email,username,password].some( (field) => field?.trim() === "" )
         ) {
        throw new ApiError(400,"All Fields are Required")
          }
    // check if user already exists
    const existedUser = await User.findOne({
        $or: [ { username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User With email or username already exists");
    }


    // check for image,avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.CoverImage[0]?.path;
       
  // check if coverimage is given or not if not given so no err
    let coverImageLocalPath ;
    if (req.files && Array.isArray(req.files.CoverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar File Is Required");
    }

    // upload them to cloudinary,avatar

    const avatar =  await uploadonCloudinary(avatarLocalPath);
    const coverImage = await uploadonCloudinary(coverImageLocalPath);
     
    if (!avatar) {
        throw new ApiError(400,"Avatar is Required");
    }

    // create user object - create entry in database
    const user = await User.create({
        fullName,
        email,
        avatar : avatar.url,
        CoverImage : coverImage?.url || "",
        password,
        username : username.toLowerCase(),
    })


    // remove password and refresh token field in response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"something went wrong while registering user");
    }

      // return response to frontend
     return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
     );
})

// Function/Method to login a user
const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email
    // find the user
    // check password
    // access and refresh token generation
    // send cookies

    const {email,username,password} = req.body

    // validation - not empty   
    if (!(username || email)) {
        throw new ApiError(400,"Username or Email is Required");
    }
  
    // find the user in db from its username or email
    const user = await User.findOne({
        $or: [{ username },{ email }]
    })
   
    if(!user){  //if  not then throw error
        throw new ApiError(404,"User Does Not Exists")
    }

    // check password from bcryot from User model
   const isPasswordValid =  await user.isPasswordCorrect(password);

    if(!isPasswordValid){  // if not then throw error
        throw new ApiError(404,"Invalid user Credentials");
    }

    // generate access and refresh tokens
   const {accessToken,refreshToken} =  await generateAccessAndRefreshToken(user._id);
   
   // remove password and refresh token from user obejct
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    // set cookies in response
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

// Function/Method to logout a user
const logoutUser = asyncHandler(async (req,res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

//  Function/Method to refresh access token
const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefrshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefrshToken) {
        throw new ApiError(401,"unauthorizedd request")
    }

     try {
        // verify the incoming refresh token is valid or not
         const decodedToken = jwt.verify(
           incomingRefrshToken, 
           process.env.REFRESH_TOKEN_SECRET
        )
        // find the user from the decoded token
        const user = await User.findById(decodedToken?._id)
   
        if (!user) {
           throw new ApiError(401,"Invalid Refresh Token")
       }
    
         // check if the incoming refresh token is same as the user's refresh token
        if (!incomingRefrshToken !== user?.refreshToken) {
           throw new ApiError(401," Refresh Token is expired or used")
       }
   
        const options = {
           httpOnly : true,
           secure : true
        }
   
        // generate new access and refresh token
        const { accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
   
   
        // update the user's refresh token in the database
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
           new ApiResponse(
               200,
               {accessToken,refreshToken : newrefreshToken},
               "Access Token Refreshed Successfully"
           )
        )
     } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refres Token")
     }
})

// Function/Method to change current user's password
const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldpassword , newPassword} = req.body  // get old and new password from request body

    const user = await User.findById(req.user?._id)

    const isPasswordcorrect = await user.isPasswordCorrect(oldpassword) // check if old password is correct or not

    if (!isPasswordcorrect) {
        throw new ApiError(400, " Invalid old passworrd")
    }

    user.password = newPassword  // set new password to user object
    await user.save({validateBeforeSave : false})  // save the user object with new password

    return res   // send response to frontend
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password Changed Successfully")
    )
})


// Function/Method to get current user details
const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Curent User Fetched Successfully"
    ))
})

// Function/Method to update current user's account details
const updateAccountDetails = asyncHandler(async (req,res) =>{
    const {fullName , email} = req.body

    if (!(fullName || email)) { // check if fullName or email is provided
        throw new ApiError(402, "All fields are required")
    }

   const user = await  User.findByIdAndUpdate( // set new fullName and email to user object
        req.user?._id,
        {
            $set :{
                fullName,
                email 
            }
        },
        {new : true}
    ).select("-password") // remove password 

    return res
    .status(201)
    .json(new ApiResponse(201,user,"Account Details updated Successfully"))
})

// Function/Method to update current user's avatar
const  updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarlocalpath = req.file?.path // fetch avatar local path from request file

    if (!avatarlocalpath) {
    throw new ApiError(400,"Avatar File Is Missing")
  }

    const avatar = await uploadonCloudinary(avatarlocalpath) // upload avatar to cloudinary

  if (!avatar.url) { 
    throw new ApiError(400,"Error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,  // set new avatar url to user object
        {
             $set : {
            avatar : avatar.url
        }
    },
    {new : true} // to return the updated user object
    ).select("-password")

    // old avatar delete logic // optionally add by me
      try {
        if (user.avatar?.public_id) {
          await cloudinary.uploader.destroy(user.avatar.public_id);
       }
      } catch (error) {
        throw new ApiError(500," Error While Deletng the Old Avatar");
      }


 return res
  .status(200)
  .json(
    new ApiResponse(200, user,"avatar updated successfully")
  )
})

// Function/Method to update current user's cover image
const  updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverimagelocalpath = req.file?.path


     if (!coverimagelocalpath) {
          throw new ApiError(400,"coverimage File Is Missing")
    }

      const coverimage = await uploadonCloudinary(coverimagelocalpath)

     if (!coverimage.url) {
         throw new ApiError(400,"Error while uploading on coverIamge")
     }

     await User.findByIdAndUpdate(
       req.user?._id,
      {
        $set : {
            coverImage : coverimage.url
        }
       },
       {new : true}
   ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user,"coverImage updated successfully")
  )

})


 const getUserChannelProfile = asyncHandler(async (req,res) => {
      const {username} = req.params

      if (!username?.trim()) {
         throw new ApiError(400,"username is missing")
      }

     const channel = await User.aggregate([
        {
            $match:  {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {  //count subscribers of channel
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers" 
            }
        },
        {
            $lookup : { //count chnnels which subscribed by user
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscriberesCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond: {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false 
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                subscriberesCount :1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                CoverImage : 1,
                email : 1,
                createdAt : 1,
            }
        }
     ])
     console.log(channel);

       if (!channel?.length) {
              throw new ApiError(404,"Channel Does Not Exists")
       }

      return res
      .status(200)
      .json(
        new ApiResponse(200,channel[0],"User Channel profile fetched successfully")
      ) 
 })

 
 const getWatchHistory = asyncHandler(async (req,res ) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.
                    user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup: {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project: {
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "WatchHistory Fetched successfully"
        )
    )
 }) 

export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory
};     