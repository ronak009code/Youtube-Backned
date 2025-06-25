import { asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/apiError.js';
import { User} from "../Models/user.models.js";
import { uploadonCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';

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

export { registerUser }; 