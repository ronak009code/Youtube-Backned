import mongoose,{ Schema } from "mongoose";
import { Comment } from "../Models/comment.model.js";
import { Like } from "../Models/Like.model.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { ApiError } from "../utills/apiError.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { Video} from "../Models/video.models.js";

// get all comments for a video
const getVideoComments = asyncHandler( async (req,res) => {
    const { videoId} = req.params;
    const { page = 1,limit = 10 } = req.query;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404,"Video not Found");
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",            
            },
        },
        {
            $lookup:{
               from:"likes",
               localField:"_id",
               foreignField:"comment",
               as:"likes",
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if:{ $in: [req.user?._id, "$likes.likedBy"] },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project: {
                content:1,
                createdAt:1,
                likesCount:1,
                owner: {
                    username:1,
                    fullName:1,
                    "avatar.url":1
                },
                isLiked:1
            }
        }
    ]);

    const options = { // firstly show a limited comments
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    };
   
    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comments Fetched Successfully!"));
})


// add a comment to a video
const addComment = asyncHandler( async (req,res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400,"content is Required!");
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    });

    if (!comment) {
        throw new ApiError(500,"Failed to add comment Try Again!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment added Successfully"
        )
    )
});

// update a comment
const updateComment = asyncHandler( async (req,res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400,"Content is Required!")
    }

    const comment =  await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(400,"comment not found!!")
    }

    // if comment owner and user who req to update comment are not match then err
    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only comment owner can edit their comment!!")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        { new : true}
    );

    if (!updateComment) {
        throw new ApiError(500,"Failed to edit a comment try again!!!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateComment,"Comment Updated Successfully!!"));
})

// delete a comment 
const deleteComment = asyncHandler( async (req,res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only comment owner can delete their comment!!")
    }

    await Comment.findByIdAndDelete(commentId);

    //data cleanUp after a delete a comment to a realated likes
    await Like.deleteMany({
        comment:commentId,
        likedBy:req.user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,{ commentId},"comment deleted successfully!!")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}