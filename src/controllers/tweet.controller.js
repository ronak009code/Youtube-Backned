import { asyncHandler} from "../utills/asyncHandler.js";
import { ApiError} from "../utills/apiError.js";
import { ApiResponse} from "../utills/ApiResponse.js";
import { Tweet } from "../Models/tweet.model.js";
import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../Models/user.models.js";

// method for creating a tweet
const createTweet = asyncHandler( async (req,res) => {
    const { content } = req.body; // fetch content/text from rewbody

    if (!content) {
        throw new ApiError(404,"content is required!");
    }

    // create object in db
    const tweet = await Tweet.create({
        content,
        owner:req.user?._id,
    });

    if (!tweet) {
        throw new ApiError(500,"Failed to create a tweet pls try again!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet Created Successfully!"));
})

// method for updating a tweet
const upldateTweet = asyncHandler( async (req,res) => {
    const { content } = req.body;
    const { tweetId } = req.params; //fetch id from params

    if (!content) {
        throw new ApiError(400,"Content Is Required!");
    }

    // check in db if is there or not
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"invalid twwetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(400,"tweet not found");
    }

    // match that owner and curent user is same for edititng tweet
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can edit their tweets");
    }

    // new update tweet in db
    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!newTweet) {
        throw new ApiError(500,"Failed To edit Tweet plese Try Again!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,newTweet,"tweet updated successfully"));
})

// method for delete tweet
const deleteTweet =  asyncHandler( async (req,res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Invalid TweetId!");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404,"tweet not found!");
    }

    // check if user is owner of tweet or not
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can delete their tweet!");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(new ApiResponse(200,{tweetId},"Tweet deleted Successfully!"));
})

// methdod for how many tweet user tweets
const getUserTweets = asyncHandler( async (req,res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid User!!");
    }

    // pipeline for fetching user tweets
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username:1,
                            "avatar.url":1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from:"likes",
                localField:"_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy:1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size:"$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id,"$likedDetails.likedBy"]},
                        then:true,
                        else:false
                    }
                },
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content:1,
                ownerDetails:1,
                likesCount:1,
                createdAt:1,
                isLiked:1
            },
        },
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200,tweets,"Tweets fetched Successfully!!"));
})

export {
    createTweet,
    upldateTweet,
    deleteTweet,
    getUserTweets
}