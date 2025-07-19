import { Playlist } from "../Models/playlist.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/apiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../Models/video.models.js";

// method for creting playlist 
const createPlaylist = asyncHandler( async (req,res) => {
    const { name,description } = req.body;

    if (!name || !description) {
        throw new ApiError(400,"Name And Description Both Are Required!!");
    }

    // create object in DB
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    // check if it is created or not in db
    if (!playlist) {
        throw new ApiError(500,"Failed to create playlist!");
    }
    return res
    .status(201)
    .json(
        new ApiResponse(201,playlist,"playlist created successfully")
    )
})

// method for update  playlist
const updatePlaylist = asyncHandler( async (req,res) => {
    const { name,description } = req.body;
    const { playlistId} = req.params;

    if (!name || !description) {
        throw new ApiError(400,"name and description both are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404,"playlist not found");
    }

    // check if user and who created playlist is same or not
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"only owner can edit the playlist");
    }

    // if done then update playlist
    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description,
            },
        },
        {new : true}
    );

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            updatePlaylist,
            "playlist was updated successfully!!"
        )
    )
});

// method for delete playlist
const deletePlaylist = asyncHandler( async (req,res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404,"playlist not found")
    }

    // check if who created and curent user is same or not
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can delete their playlist!");
    }

    // if done then delete it
    await Playlist.findByIdAndDelete(playlist?._id);

    return res
    .status(201)
    .json(new  ApiResponse(
        200,
        {},
        "playlist deleted successfully"
    ))
})

// method for add video in exist playlist
const addVideoToplaylist = asyncHandler( async (req,res) => {
    const { playlistId,videoId } = req.params;

    //check if video or playlist is exist or not
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400,"invalid playlistId or videoId!")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404,"playlist not found");
    }

    if (!video) {
        throw new ApiError(404,"video not found")
    }

    // check if owner is curent user or not
    if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can add video to their playlist");
    }

    // update it is in db
    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos:videoId,
            },
        },
        { new : true }
    );

    // check if update in db or not
    if (!updatePlaylist) {
        throw new ApiError(500,"failed to add video to playlist please try again")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            updatePlaylist,
            "Added Video to Playlist Successfully!!"
        )
    );
});

// method for removing video from playlist
const removeVideoFromplaylist = asyncHandler( async (req,res) => {
    const { playlistId,videoId} = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid playlistid or videoid");
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404,"playlist not found")
    }

    if (!video) {
        throw new ApiError(404,"video not found")
    }

    if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"only owner can remove their video from playlist")
    }

   const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
        //used to remove all instances of a specified value or values from an array within a document
        $pull: {
            videos: videoId,
        },
    },
    { new : true}
   );

   return res
   .status(201)
   .json(
    new ApiResponse(
        200,
        updatePlaylist,
        "Removed video from playlist done!"
    )
   )

})

// method for fetching existing playlist
const getPlaylistById = asyncHandler( async (req,res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"inavalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404,"Playlist Not Found")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
            }
        },
        {
            $match: {
                "videos.isPublished": true
            }
        },
        {
            $lookup: {
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$video.views"
                },
                owner: {
                    $first:"$owner"
                }
            }
        },
        {
            $project: {
                name:1,
                description:1,
                createdAt:1,
                updatedAt:1,
                totalVideos:1,
                totalViews:1,
                videos: {
                    _id:1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    title:1,
                    description:1,
                    duration:1,
                    createdAt:1,
                    views:1
                },
                owner: {
                    username:1,
                    fullName:1,
                    "avatar.url":1
                }
            }
        }
    ]);

    return res
    .status(201)
    .json(new ApiResponse(200,playlistVideos[0],"playlist fetched successfully"))
})

// method for fetching user playlists
const getUserPlylists = asyncHandler( async (req,res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"invalid userId");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id:1,
                name:1,
                description:1,
                totalVideos:1,
                totalViews:1,
                updatedAt:1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"user playlists fetched successfully!!"))
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToplaylist,
    removeVideoFromplaylist,
    getPlaylistById,
    getUserPlylists
}