import mongoose,{ isValidObjectId } from "mongoose";
import { Like } from "../Models/Like.model.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { ApiError } from "../utills/apiError.js";
import { asyncHandler } from "../utills/asyncHandler.js";


// create a method for toggle/switch likes
const toggleVideoLike = asyncHandler(async (req,res) => {
    const { videoId } = req.params;  // fetch videoid from reqparams

    if (!isValidObjectId(videoId)) {  // check if id is valid or not
        throw new ApiError(400,"Invalid videoId")
    }

   // check if user already liked or not
    const likedAlready = await Like.findOne({
        video:videoId,   
        likedBy:req.user?._id,       
    })
    
    // if liked done then delete it when toggle/press again
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked:false}))
    }

    await Like.create({ // if not then create a like object
        video:videoId,
        likedBy:req.user?._id,
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{ isLiked:true}));
});


// create a method for toggle comment like
const toggleCommentLike = asyncHandler(async (req,res) => {
    const { commentId } = req.params; // fetch id from req.params

    // check if id is valid on db or not
    if (!isValidObjectId(commentId)) { 
        throw new ApiError(401,"invalid commentId")
    }

     // check if liked or not before
     const likedAlready = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id,       
    })
    
    // if alredy liked so when again toggle it,will be deleted
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked:false}))
    }

    // if not liked then create a object 
    await Like.create({
        comment:commentId,
        likedBy:req.user?._id,
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{ isLiked:true}));
})

// create a method for tweet like
const toggleTweetLike = asyncHandler(async (req,res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401,"invalid tweetId")
    }


     const likedAlready = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id,       
    })
    
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked:false}))
    }

    await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id,
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{ isLiked:true}));
})


// create a method for fetch alredy liked videos 
const getLikedVideos = asyncHandler(async (req,res) => {
    const likedVideoAggregate = await Like.aggregate([ // create a pipeline for liked videos
        {
            $match:{  // match by userid so fetch videoid
                likedBy:new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup:{ // create a separate object in field
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideo",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails",
                        },
                    },
                    {    // create a each element seperate from an array
                        $unwind : "$ownerDetails",
                    },
                ]
            }
        },
        {
            $unwind:"likedVideo",
        },
        {  
            $sort: {  // newset Liked videos shows first
                createdAt:-1,
            }
        },
        {  // project will be decided what to send or not
            $project:{
                _id:0,
                likedVideo:{
                    _id:1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    owner:1,
                    title:1,
                    description:1,
                    views:1,
                    duration:1,
                    createdAt:1,
                    isPublished:1,
                    ownerDetails:{
                        username:1,
                        fullName:1,
                        "avatar.url":1, 
                    },
                },
            },
        },
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideoAggregate,
            "Liked Videos fetched successfully!"
        )
    )
});


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}