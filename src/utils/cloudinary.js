import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath) return "can't find the local path"
        //uploading on cloudinary

       const response = await  cloudinary.uploader.upload(localFilePath,{resource_type: "auto"})

       // console.log(response.url, "log inside coudinary to check for url of file ")

        fs.unlinkSync(localFilePath)
            return response

    }
    catch(err){
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file as the upload operation got failed

        return " upload operation failed"
    }
}


export {uploadOnCloudinary}
