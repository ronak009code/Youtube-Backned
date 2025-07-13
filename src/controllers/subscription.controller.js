import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utills/apiError.js";
import { ApiResponse} from "../utills/ApiResponse.js";
import { asyncHandler} from "../utills/asyncHandler.js";
import { Subscription } from "../Models/subscription.models.js";


// method for a togglesubscription
const toggleSubscription = asyncHandler( async (req,res) => {
    const { channelId} = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid ChannelId");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId
    })

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed : false},
                "Unsubscribed successfully!"
            )
        )
    }

    await Subscription.create({
        subscriber:req.user?._id,
        channel:channelId,
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { isSubscribed: true},
            "subscribed Successfully!!"
        )
    )
})

// controller for a return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler( async (req,res) => {
    let { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid ChannelId")
    }
    
    channelId = new mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:channelId,
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline: [
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribedTosubscriber",
                        },
                    },
                    {
                        $addFields:{
                            subscribedTosubscriber: {
                                $cond: {
                                    if:{
                                        $in: [
                                            channelId,
                                            "$subscribedTosubscriber.subscriber",
                                        ],
                                    },
                                    then:true,
                                    else:false,
                                },
                            },
                            subscribersCount : {
                                $size: "$subscribedTosubsciber",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind:"$subscriber",
        },
        {
            $project:{
                _id:0,
                subscriber: {
                    _id:1,
                    username:1,
                    fullName:1,
                    "avatar.url":1,
                    subscribedTosubscriber:1,
                    subscribersCount:1,
                }
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "subscribers fetched successfully"
        )
    )
})


// controller to return channelList to which user has a subscribed
const getSubscriberChannels = asyncHandler( async (req,res) => {
    const { subscriberId } = req.params;

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup: {
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannel",
                pipeline : [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField : "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos",
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel",
        },
        {
            $project: {
                _id:0,
                subscribedChannel: {
                    _id:1,
                    username:1,
                    fullName:1,
                    "avatar.url":1,
                    latestVideo: {
                        _id:1,
                        "videoFile.url":1,
                        "thumbnail.url":1,
                        owner:1,
                        title:1,
                        description:1,
                        duration:1,
                        createdAt:1,
                        views:1
                    },
                },
            },
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribedChannels,
            "subscribed channels fetched successfully!!"
        )
    )
});

export { toggleSubscription, getSubscriberChannels,getUserChannelSubscribers}