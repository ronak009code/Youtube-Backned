import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler} from "../utills/asyncHandler.js"
import {ApiError } from "../utills/apiError.js"
import {ApiResponse} from "../utills/ApiResponse.js"
import { deleteOnCloudinary, uploadonCloudinary} from "../utills/cloudinary.js"
import { Video} from "../Models/video.models.js"
import {User} from "../Models/user.models.js"
import { text } from "express"


// get all videos based on query,sort and pagination
const getAllVideos = asyncHandler(async(req,res) => {
    const {page=1,limit=10,query,sortBy,userId} = req.query
    console.log(userId);
    const pipeline = [];
    
    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'

    if (query) {
        pipeline.push({
            $search:{
                index:"search-videos",
                text: {
                    query:query,
                    path: ["title","description"] // search only fpr title,descripton
                }
            }
        });
    }
   
   if (userId) { // check if useid is reaching by query is available or not

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    pipeline.push({
        $match: {
            owner:new mongoose.Types.ObjectId(userId)
        }
    });
   }


   //fetch videos only that are set isPublished as true
   pipeline.push({$match: { isPublished : true } });

   // sortBy can be views,createdAt,duration
   // sortType can be ascending(-1) or descending(1)

   if(sortBy && sortType){
    pipeline:push({
        $sort: { 
            [sortBy]: sortType === "asc"? 1:-1
        }
    })
   }else{
    pipeline.push({ $sort : { createdAt : -1} });
   }

   pipeline.push({
       $lookup: {
        from:"users",
        localfield: "owner",
        foreignField: "_id",
        as: "ownerDetaills",
        pipeline: {
            $project:{
                username:1,
                "avatar.url":1
            }
         }
    }
   },
      {
       $unwind: "$ownerDetails"
      }
)

  const videoAggregate =  await Video.aggregate(pipeline);

  const options = {
    page: parseInt(page,10),
    limit: parseInt(limit,10)
  };

  const video = await Video.aggregatePaginate(videoAggregate,options);

  return res
  .status(200)
  .json(new ApiResponse(200,video,"videos fetched successfully"));

})

//get video, upload to cloudinary,create vidoe
const publishVideo = asyncHandler(async(req,res) => {
     const {title,description } = req.body // fetch the data from body

     // check if field is not empty or not
     if ([title,description].some((field) => field?.trim() === "" )) {
         throw new ApiError(400,"All Fields are Required");
     }

       
      // fetch the path from req.files 
     const videoFileLocalPath = req.files?.videofile[0].path;
     const thumbnailLocalPath = req.files?.thumbnail[0].path;
  
     // check if path is fetched or not
     if (!videoFileLocalPath) {
         throw new ApiError(400,"video is Required")
     }
     
     if (!thumbnailLocalPath) {
         throw new ApiError(400,"thumbnail is Required")
     }

     // if fetched then upload to cloudinary 
     const videoFile = await uploadonCloudinary(videoFileLocalPath);
     const thumbnail = await uploadonCloudinary(thumbnailLocalPath);

     // check if videofile is successfully uploaded or not
      if (!videoFile) {
          throw new ApiError(400,"Video File Not found")
      }

      if (!thumbnail) {
          throw new ApiError(400,"thumbnail File Not found")
      }

      // if done then create object in database
      const video = await Video.create({
         title,
         description,
         duration: videoFile.duration,
         videofile:{
            url: videoFile.url,
            public_id: videoFile.public_id
         },
         thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
         },
         owner: req.user?._id,
         isPublished: false 
      });

      // match a id from database
      const videoUpload = await Video.findById(video._id);

      if (!videoUpload) {
        throw new ApiError(500,"Uploading a Video Failed TryAgian!!!")
      }
 
      // return response to the frontend 
      return res
      .status(200)
      .json(new ApiResponse(200,video,"Video Uploded Successfully"))
})

// fetch the video by id and show to the user
const getVideoById = asyncHandler(async(req,res) => {
     const { videoId } = req.params // fetch id from params

     if (!isValidObjectId(videoId)) { // match in database is id exists or not
        throw new ApiError(400,"Invalid VideoId")
     }

     const video = await Video.aggregate([  // create pipline for video
         {
            $match:{  // match in mongoose
                _id:new mongoose.Types.ObjectId(videoId)
            }
         },
         {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
         },
         {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscriberscount:{
                                $size:"$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if:{
                                        $in:[
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            username:1,
                            "avatar.url":1,
                            subscriberscount:1,
                            isSubscribed:1
                        }
                    }
                ]  
            }
         },
         {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked: {
                    $cond:{
                        if:{$in:[req.user?._id,"$liked.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
         },
         {
            $project:{
                "videoFile.url":1,
                title:1,
                description:1,
                views:1,
                createdAt:1,
                duration:1,
                comment:1,
                owner:1,
                likesCount:1,
                isLiked:1
            }
         }
     ]);

   if (!video) {
       throw new ApiError(500,"failed to fetch video")
   }

   await Video.findByIdAndUpdate(videoId,{ // increment the views in database
      $inc: {
        views:1
      }
   })

   await User.findByIdAndUpdate(req.user?._id,{ // fill videoid in watchhistory
       $addToSet:{
          watchHistory: videoId
       }
   });

   return res
   .status(200)
  .json(
    new ApiResponse(200,video[0],"Video Details Fetched Successfully!!")
  )

})

// updating exists video information 
const updateVideo = asyncHandler(async (req,res) => {
      const {title,description} = req.body // fetch title,des
      const {videoId} = req.params

      if (!isValidObjectId(videoId)) {  // check if video was exists or not
         throw new ApiError(400,"Invalid Video")
      }

      if (!(title && description)) { 
          throw new ApiError(400,"Title and Description are required")
      }

      const video = await Video.findById(videoId);

      if (!video) {
        throw new ApiError(404,"No Video found")
      }
 
      //match both videoId and it owner to be which upload the video
      if (video?.owner.toString() !== req.user?._id.toString()) {
          throw new ApiError(404,"You Cant Edit The Video As You Are Not The Owner")
      }

     // fetch old thumbnail id to delete after update
      const thumbnailTODelete = video.thumbnail.public_id;

      // fetch path from file 
      const thumbnailLocalPath =  req.file.path;

      if (!thumbnailLocalPath) {
         throw new ApiError(400,"Thumbnsil Is Required!!")
      }

      // if done then upload to cloudinary
      const thumbnail = await uploadonCloudinary(thumbnailLocalPath);

      if (!thumbnail) {
        throw new ApiError(400,"thumbnail not found")
      }

      // updating the database
     const updatingVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title,
                description,
                thumbnail: {
                    public_id : thumbnail?.public_id,
                    url: thumbnail?.url
                }
            }
        },
        {new : true}     
    );

    if (!updatingVideo) {
        throw new ApiError(500,"Failed To upload a video Try again!!")
    }

    if (updatingVideo) { //after all successfull delete old thumbnail
        await deleteOnCloudinary(thumbnailTODelete);
    }

    return res
    .status(200)
    .json(new ApiResponse(201,updatingVideo,"Video Updated Successfully"))
})

// deleteing the video
const deleteVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params; // fetch videoid

    if (!isValidObjectId(videoId)) { // check if video exists in db
        throw new ApiError(400,"Invalid VideoId")
    }

    const video = await Video.findById(videoId); // if done then find
    
    if (!video) {
        throw new ApiError(404,"Video Not Found")
    }
 
    // match video and user id is same or not
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"You Have Not Authority to Delete The Video");
    }

    // find it id and delete
    const videoDelted = await Video.findByIdAndDelete(video?._id);

    if (!videoDelted) {
        throw new ApiError(400,"failed to delete the video try again");
    }

    // delete from cloudinary
    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id);

    // also delete likes
    await Like.deleteMany({
        video:videoId  
    })

    //also delete comments
    await Comment.deleteMany({
        video:videoId,
    })

    //return response to frontend
    return res
    .status(201)
    .json(new ApiResponse(200,{},"video deleted successfully!"))
})

// toggle video
const togglePublishStatus = asyncHandler(async (req,res) => {
    const {videoId} = req.params // fetch id from params

    if (!isValidObjectId(videoId)) {  // match id by db
        throw new ApiError(400,"invalid videoid")
    }

    const video  = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400,"video not found")
    }
    
    // match both owner and video status
    if (video?.owner.toString() !== req.user?._id) {
         throw new ApiError(400,"you cant toggle publish status as you are not the owner") 
    }

    // set in db and update
    const toggleVideopublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished:!video?.isPublished   
            }
        },
        {new : true}
    )

    if (!toggleVideopublish) {
        throw new ApiError(500,"Failed to toggle video publish status")
    }

    return res
    .status(201)
    .json(new ApiResponse(200,
        {isPublished:toggleVideopublish.isPublished},
        "Video publish toggled successfully"
    ))
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}