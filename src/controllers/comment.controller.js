import mongoose , {isValidObjectId} from "mongoose"
import {Comment} from "../models/Comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


const getVideoComments = asyncHandler(async(req,res) => {
    const {videoid} = req.params ;
    const {page = 1 , limit = 10}=req.query ;

    if (!isValidObjectId(videoId)) {
         throw new ApiError(400, "Invalid video ID");
    }
    
    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const comments = await Comment.aggregate([
        {
            $match:{
                video: videoObjectId,
            },
        },

        {
            $lookup:{
                from:"videos",
                localField: "video",
                foreignField: "_id",
                as: "CommentsByVideo",
            },
        },
        {
            $lookup:{
                from: "users",
                localFiels: "owner",
                foreignFiels: "_id",
                as: "CommentsByOwner",
            },
        },

        {
            $project: {
                content: 1,
                owner: {
                    $arrayElemAt: [$CommentsByOwner, 0],
                },
                video: {
                    $arrayElemAt: ["$CommentsByVideo", 0],
                },
                createdAt: 1,
            },            
        },

        {
            $skip: (page - 1) * limit,
        },

        {
            $limit: parseInt(limit),
        },
       
    ]);

        if(!comments?.length){
            throw new ApiError(404, "No comments found for this video");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, comments, "Comments fetched successfully"));
        });

const addComment = asyncHandler( async(req,res) => {

    const {videoId} = req.params ;
    const {content} = req.body ;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    if(!req.user){
        throw new ApiError(401,"You must be logged in to comment")
    }

    if(!content){
        throw new ApiError(400,"Comment content is required")
    }
    
    const addedComment = await Comment.create({
        content,
        owner: req.user?.id,
        video: videoId
    });

    if(!addedComment){
        throw new ApiError(500,"Failed to add comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, addedComment, videoId, "Comment added successfully")
        );
    
});

const updateComment = asyncHandler( async(req,res) => {

    const {commentId} = req.params ;
    const {content} = req.body ;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id")
    }

    if(!req.user){
        throw new ApiError(401,"You must be logged in to update comment")
    }

    if(!content){
        throw new ApiError(400,"Comment content is required")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { 
            _id: commentId,
            owner: req.user._id,
        },
        {
            $set: { content , },
        },
        { new: true}
    );

    if(!updatedComment){
        throw new ApiError(500, "Something went wrong while updating the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, commentId, "Comment updated successfully")
        );   

});

const deleteComment = asyncHandler( async(req,res) => {

    const {commentId} = req.params ;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id")
    }

    if(!req.user){
        throw new ApiError(401,"You must be logged in to delete comment")
    }

    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id,
    });

    if(!deletedComment){
        throw new ApiError(500, "Something went wrong while deleting the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedComment, commentId, "Comment deleted successfully")
        );

});

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}