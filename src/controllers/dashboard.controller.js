import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { ApiError } from "../utills/apiError.js";
import { Video } from "../Models/video.models.js";
import { Like } from "../Models/Like.model.js";
import { Subscription } from "../Models/subscription.models.js";
import mongoose from "mongoose";

const getChannelStats = asyncHandler( async (req,res) => {
    // TODO : get channel stats like total video,total subscriberes,total video views,total likes etc.

    const userId = req.user?._id;

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                subscribersCount: {
                    $sum: 1
                }
            }
        }
    ]);

    const video = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: "$views",
                totalVideos:1
            }
        },
        {
            $group: {
                _id:null,
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViwes"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ]);

    const channelStats = {
        totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0,
        totalVideos: video[0]?.totalVideos || 0,
    };

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            channelStats,
            "channel stats fetched successfully!!!"
        )
    )
});


const getChannelVideos = asyncHandler( async (req,res) => {
    // TODO: get all the videos uploaded by the channel
    
    const userId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $addFields: {
                createdAt: {
                    $dateToParts: { date: "$createdAt" }
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                createdAt:-1
            }
        },
        {
            $project: {
                _id:1,
                "videoFile.url":1,
                "thumbnail.url":1,
                title:1,
                description:1,
                createdAt: {
                    year:1,
                    month:1,
                    day:1
                },
                isPublished:1,
                likesCount:1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "channel stats fetched successfully!!"
        )
    )
});


export { getChannelStats, getChannelVideos }