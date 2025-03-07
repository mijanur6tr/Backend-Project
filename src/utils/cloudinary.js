import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
       if(!localFilePath) return null;
       //cloudinary file upload
       const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
       })
       //file uploaded successfully
       console.log("file has uploaded on cloudinary successfully",response.url);
       return response;
       
    } catch (error) {
        fs.unlink(localFilePath);//remove locally save file as upload failed
        return null;
    }
}


// const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });