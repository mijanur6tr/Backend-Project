import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
  
const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user =await User.findById(userId);
        
        // if (!user) {
        //     throw new ApiError(404, "User not found");
        // }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        

        user.refreshToken=refreshToken;
        await user.save({ validateBeforeSave: false });
        
        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating the refresh and access token")
    }
}

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
                (fields) => fields?.trim()===""
            )
        ) {
            throw new ApiError(400,"All the fields are required.")
        }

        // //if the user already exist? checking throug email,username
        


        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existedUser) {
            throw new ApiError(409,"User already exists.");
        };

        //avater and cover imgae path taking and avatar is there or not checking

        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
            coverImageLocalPath=req.files.coverImage[0].path
        }

        console.log(req.files)

       

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
            username
        })

        //remove password and refresh token from the response

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        //checking user created or not

        if ( !createdUser) {
            throw new ApiError(500,"Something went wrong while registering the uer!")
        }

        return res.json(
            new ApiResponse(201,createdUser,"User successfully registered!")
        )



    }
)


const logInUser = asyncHandler(
     async (req,res) => {
    //data from request.body
    //check email and username
    //find the user
    //check password
    //refresh token and access token
    //send cookies
    const {username,password,email} = req.body;
 


    if (!username && !email) {
        throw new ApiError(400,"Username or email is required.")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"user is not availabe")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);  

    if (!isPasswordValid) {
        throw new ApiError(401,"password is not valid")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInuser = User.findById(user._id).select("-password -refreshToken");

    const option = {
        httpOnly:true,
        secure:true
        
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                id:loggedInuser._id,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )

}
)


const logOutUser = asyncHandler(
    async (req,res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true
            }
        )

        const option = {
            httpOnly:true,
            secure:true
        }

        return res
        .status(200)
        .clearCookie("accessToken",option)
        .clearCookie("refreshToken",option)
        .json(200,{},"user logged out.")
}
)


const refreshAccessToken = asyncHandler(
    async (req,res) => {
        const imcomingRefrestToken = req.cookies.refreshToken || req.body.refreshToken

        if (!imcomingRefrestToken) {
            throw new ApiError(401, "Unauthorized request.")
        }

        try {
            const decodedToken = jwt.verify(imcomingRefrestToken,process.env.REFRESH_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id)
    
            
            if (!decodedToken) {
                throw new ApiError(401, "refresh token invalid")
            }
    
            if (imcomingRefrestToken !== user?.refreshToken) {
                throw new ApiError(401, "refresh token is expired or used.")
            }
    
            const options = {
                httpOnly:true,
                secure:true
            }
    
            const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user?._id)
    
            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "Token refreshed successfully"
            )
        } catch (error) {
            throw new ApiError(400,error?.meassage || "invalid refresh token")
        }

    }
)

const changeCurrentPassword = asyncHandler(
    async (req,res) => {
        const {oldPassword,newPassword,confPassword} = req.body;
        const user = await User.findById(req.user?._id)

        if (!(newPassword  === confPassword)) {
            throw new ApiError(404,"new password and confirm password must be same")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400,"invalid old password")
        }

        user.password= newPassword;
        user.save({validateBeforeSave:false})

        return res
        .status(200)
        .json(
           new ApiResponse(200,user,"password changed successfully")
        )
        

    }
)

const getCurrentUser = asyncHandler(
    async (req,res) => {
        return res
        .status(200)
        .json(
            new ApiResponse(200,req.user,"user fetched successfully")
        )
    }
)

const updateAccountDetails = asyncHandler(
    async (req,res) => {
        const {fullname,email} = req.body;

        if (!fullname || !email) {
            throw new ApiError(400, "Both the fields is required.")
        }

        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullname,
                    email
                },
            },
            {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"details updated successfully")
        )

    }
)

const updateUserAvater = asyncHandler(
    async (req,res)=>{

        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError(404,"avatar file is missing")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            throw new ApiError(404,"problem while uploading avatar on cloudinary")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"avatar updated successfully")
        )

    }
)

const updateUserCoverImage = asyncHandler(
    async (req,res)=>{

        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(404,"cover image file is missing")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage.url) {
            throw new ApiError(404,"problem while uploading cover image on cloudinary")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"cover image updated successfully")
        )


    }
)

export {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage
}