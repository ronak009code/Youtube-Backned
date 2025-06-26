import { asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/apiError.js';
import { User} from "../Models/user.models.js";
import { uploadonCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generatraccessToken
        const refreshToken =  user.generaterefreshToken
        
        User.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false})
   
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500," Something Went Wrong While Generating Access and Refresh Token");
    }
}


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

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email
    // find the user
    // check password
    // access and refresh token generation
    // send cookies

    const {email,username,password} = req.body

    if (!username || !email) {
        throw new ApiError(400,"Username or Email is Required");
    }
  
    const user = await User.findOne({
        $or: [{ username },{ email }]
    })
   
    if(!user){
        throw new ApiError(404,"User Does Not Exists")
    }

   const isPasswordValid =  await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid user Credentials");
    }

   const {accessToken,refreshToken} =  await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

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

export {
     registerUser,
     loginUser,
     logoutUser
}; 