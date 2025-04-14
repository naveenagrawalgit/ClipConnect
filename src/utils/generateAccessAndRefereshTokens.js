import { ApiError } from "./ApiError.js"
import { User } from "../models/user.model.js"
 
 
 
 const generateAccessAndRefereshTokens = async(userId) =>{

    try {

        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refereshToken =  user.generateRefreshToken()

        // saving the refresh token inside of the user object which is going to be stored in mongodb
        user.refereshToken = refereshToken
        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refereshToken}
        
    } catch (error) {
        throw new ApiError(500, "error while generating access and refresh token")
    }

 }


 export {generateAccessAndRefereshTokens}