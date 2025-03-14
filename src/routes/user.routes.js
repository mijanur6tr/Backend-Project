import { Router } from "express";
import { 
    changeCurrentPassword, 
    getChannelUser, 
    getCurrentUser, 
    getWatchHistory, 
    logInUser, 
    logOutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvater, 
    updateUserCoverImage 
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(logInUser)

//secure routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar") ,updateUserAvater)
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage") ,updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getChannelUser)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;