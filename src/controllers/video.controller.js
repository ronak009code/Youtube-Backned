import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler} from "../utills/asyncHandler.js"
import {ApiError } from "../utills/apiError.js"
import {ApiResponse} from "../utills/ApiResponse.js"
import { uploadonCloudinary} from "../utills/cloudinary.js"
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

export {
    getAllVideos,
    publishVideo
}