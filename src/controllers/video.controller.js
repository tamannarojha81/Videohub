import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId } = req.query;
           
         if(!req.user){
            throw new ApiError(401, "User needs to be logged in");
         }

         const match ={
            ...(query ? {title: {$regex: query, $options: "i"}} : {}),
            ...(userId ? {owner: mongoose.Types.ObjectId(userId)} : {}),
         };

         const videos =await Video.aggregate([
            {
                $match: match
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "videosByOwner",
                },
            },
            {
                $project: {
                    videoFile: 1,
                    thumbnailFile: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    isPublished: 1,
                    owner:{
                        $arrayElementAt: ["$videosByOwner", 0],
                    },
                },               
            },

            {
                $sort: {
                    [sortBy]: sortType === "desc" ? -1: 1,
                },
            },

            {
                $skip: (page -1) * limit,
            },

            {
                $limit: parseInt(limit),
            },                

         ]);


         if(!videos?.length){
            throw new ApiError(404, "No videos found");
         }

         return res
            .status(200)
            .json(new ApiResponse(200, "Videos fetched successfully", videos));

    });



const publishVideo = asyncHandler(async (req,res) => {
    // const {VideoId} = req.params;

    const { title, description, duration } = req.body;
   
    if(!title){
        throw new ApiError(400, "Title is required");
    }

    if(!description){
        throw new ApiError(400, "Description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    console.log("videoFileLocalPath: ", videoFileLocalPath);

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video file is required");
    }

    const videoFileCloudPath = await uploadOnCloudinary(videoFileLocalPath)

    if(!videoFileCloudPath){
        throw new ApiError(400 , "Cloudinary Error: Video file is required");
    }

    const thumbnailFileLocalPath = req.file?.thumbnail[0]?.path

    if(!thumbnailFileLocalPath){
        throw new ApiError(400, "Thumbnail file is required");
    }

    const thumbnailFileCloudPath = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!thumbnailFileCloudPath){
        throw new ApiError(400 , "Cloudinary Error: Thumbnail file is required")
    }

    const videoDoc = await Video.create({
        title,
        description,
        owner:req.user._id,
        duration,
        videoFileCloudPath: videoFileCloudPath.url,
        thumbnailFileCloudPath: thumbnailFileCloudPath.url
    })

    if(!videoDoc){
        throw new ApiError(500, "Something went wrong while publishing the video");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Video published successfully", videoDoc));


})



const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id");
    }
    const videoDoc = await Video.findById(videoId).populate("owner", "name email ");
    if(!videoDoc){
        throw new ApiError(404, "Video not found");
    }

   return res
        .status(200)
        .json(new ApiResponse(200, "Video fetched successfully", videoDoc)); 

})



const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {title, description} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id");
    }
    let updateData = {title, description};

    if (req.file) {
        const thumbnailLocalPath = req.file.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail file is missing");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail.url) {
             throw new ApiError(400, "Error while uploading thumbnail");
        }
    
        updateData.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video updated successfully", updatedVideo));

    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(!deletedVideo){
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully", deletedVideo));


})

const togglePublicStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    video.isPublic = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Video public status toggled successfully", video));

    
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublicStatus
}