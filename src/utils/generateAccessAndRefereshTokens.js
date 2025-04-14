import { ApiError } from "./ApiError.js"
import { User } from "../models/user.model.js"
 
 
 
 const generateAccessAndRefereshTokens = async(userId) =>{

    try {

        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()

        console.log("---log inside  generateAccessAndRefereshTokens---",refreshToken,"logging refresh token value")
        // saving the refresh token inside of the user object which is going to be stored in mongodb
        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "error while generating access and refresh token")
    }

 }


 export {generateAccessAndRefereshTokens}