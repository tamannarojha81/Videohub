import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import {Tweet} from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, " Tweet content should not be empty or null");
    }

    const newTweet = await Tweet.create({content, owner: ownerId});

    if (!newTweet) {
        throw new ApiError(500, "Failed to create tweet");
    }
    
    return res
        .status(201)
        .json(new ApiResponse(201, "Tweet created successfully", newTweet));

});



const deleteTweet = asyncHandler(async (req, res) => {

      const { tweetId } = req.params;
      const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const tweets = await Tweet.findById(tweetId);

    if (!tweets) {
         throw new ApiError(404, "Tweets are not found");
    }
    
    if (tweet.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only delete your own tweets");
   }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);


    if (!deletedTweet) {
        throw new ApiError(500, "Something went wrong while deleting a tweet");
   } 


    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));

});




const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  if (!tweets) {
    throw new ApiError(404, "Tweets are not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
})


const updateTweet = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own tweets");
    }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );


  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating a tweet");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
})

export{
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
}