import { asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/apiError.js';
import { User} from "../Models/user.models.js";
import { uploadonCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';
import jwt from 'jsonwebtoken';


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

export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken
};     