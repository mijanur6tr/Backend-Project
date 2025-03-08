import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler(
    async(req,res)=>{
       //get data from user from frontend
       //validate not empty
       //check if already existing user, email,username
       //check for image , check for avatar 
       //upload them on cloudinary
       //create and user object, upload on database
       //remove password and refresh token from the response
       //check for user creation
       //return res


        const {username,fullname,email,password} = req.body;

        //all data validation

        if (
            [fullname,email,password,username].some(
                (fields) => fields?.thim()===""
            )
        ) {
            throw new ApiError(400,"All the fields are required.")
        }

        //if the user already exist? checking throug email,username

        const existedUser = User.findOne({
            $or:[{ username },{ email }]
        })

        if (existedUser) {
            throw new ApiError(409,"User already exists.")
        }

        //avater and cover imgae path taking and avatar is there or not checking

        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400,"Avatar is required")
        }

        //upload coverImage and avatar on cloudinary

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        //check avatar is ther or not

        if (!avatar) {
            throw new ApiError(400,"Avatar is required")
        }

        //creating and object of the user in the mongodb database

        const user = await User.create({
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url|| "",
            email,
            password,
            username:username.toLowerCase()
        })

        //remove password and refresh token from the response

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        //checking user created or not

        if ( !createdUser) {
            throw new ApiError(500,"Something went wrong while registering the uer!")
        }

        return res.statuscode(200).json(
            new ApiResponse(201,createdUser,"User successfully registered!")
        )



    }
)

export {registerUser}