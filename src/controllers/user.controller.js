import { asyncHandler } from "../utils/asyncHanndler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

   
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
 
export {registerUser}


