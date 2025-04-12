import { asyncHandler } from "../utils/asyncHanndler.js";

const registerUser = asyncHandler(async (req,res)=> {
    //get data from frontend
    // validation - check if the data is valid
    //check if user already exists: by username, email
    // check for images, check for avatar
    // create useer object - create entry in db
    // remove password and refresh token filed from response
    // check for user creation
    //return res




    const {email,password} = req.body

    console.log(email + "email");

})
 
export {registerUser}


