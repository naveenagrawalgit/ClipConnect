import { asyncHandler } from "../utils/asyncHanndler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
 import jwt from "jsonwebtoken"

import { generateAccessAndRefereshTokens } from "../utils/generateAccessAndRefereshTokens.js";



const registerUser = asyncHandler (async (req,res)=> {
    //get data from frontend
    // validation - check if the data is valid
    //check if user already exists: by username, email
    // check for images, check for avatar
    // create useer object - create entry in db
    // remove password and refresh token filed from response
    // check for user creation
    //return res

    const {email,password,fullName,username} = req.body

    console.log( "-----",req.body,"data inside req.body")
    console.log("----",email + "email");

    // checking if any field is left empty by user
    if([email,password,fullName,username].some((field)=> field?.trim()=== "")){
        throw new ApiError(400,"All fields are compulsary")
    }

    // if(email.includes("@gmail.com")){ // koi bhi dikkat ho ye uadaien sabse pehle
    //     throw new ApiError(400,"only google mails allowed")// remove if doesn't works (only lets user upload a gmail type of error)
    // }


    // checking if there is an existing user with the same email or id
   const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    })


    if(existedUser){
        throw new ApiError(409,"User with 'gmail' or username already exists")
    }


    console.log("---",req.files, "data inside req.files")

    // we get req.files form multer it gives access to files
    const avatarLocalPath = req.files?.avatar[0]?.path



   // as coverImage is not compulsary so to avoid getting a null value in avatarLocalPath we are using below logic

   // as in case if there is no coverimage cloudinary will replace it with empty string
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;

    }




// avatar local file missing
if(!avatarLocalPath){
    throw new ApiError (400, "Avatar file local address is required")
}

// uploading on cloudinary, providing local path to the clouadinary method
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
console.log(avatar)
console.log(coverImage)

// checks if avatar got uploaded to cloudinaray or not as it is required field

if(!avatar){
    console.log("----", avatar," error in avatar upload")
    throw new ApiError (400, "Avatar file is required")
}


 const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})

    //  removing password and refresh token from database output
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

        console.log("----",createdUser,"data inside created user")
    //checking if the user got created inside of database or not
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )

})
 

const loginUser = asyncHandler(async( req,res) =>{

    // get data from req.body form
    //now check if the password and username sent by the user are authenti or not (will require a database call)
    //if authentic then give access to  its data.
    //generate access and refresh token
     

    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or password is required")
    }
    // findOne() finds returns the first data which it finds relevent to the info passed
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }


   //in this we are passing the password given by user in form to isPasswrodCorrect method. This method will compare the user and stored password if they are correct for authentication be password.

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Password in not correct")
    }


    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    console.log("---- access",accessToken, "ACCESS TOKEN VALUE")
    console.log("---- refresh",refreshToken, "refreshToken  VALUE")

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   console.log("----",loggedInUser,"data inside loggedInUser")

    // to make cookies modifiable only by server
    const options = {
        httpOnly: true,
        secure: true
    }

    // accesstoken cookie

    return  res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(// setting constructor of ApiResponse
            200,// status code in apiresponse
            {
                user: loggedInUser, accessToken, refreshToken// data value in apiresponse
            },
            "user logged in successfully"// message value
            // value for status code will set automatically
        )
    )

    

})


const logoutUser = asyncHandler(async(req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
    {
        $set:{
            refreshToken: undefined
        }
    },
    {
        new: true
    }

    )
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {},"User logged out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, " unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, " Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
    
            throw new ApiError(401, "refresh token is expired or used")
    
        }
    
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken}= await generateAccessAndRefereshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newrefreshToken},
                "Access token Refreshed"
    
            )
        )
    } catch (error) {
        
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }


})


const changeCurrentPassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})



export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails}


