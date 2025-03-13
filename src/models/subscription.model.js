import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";

const subcriptionSchema = new Schema(
    {
        subscriber:{
            type : Schema.Types.ObjectId,//one who is subscribing
            ref : "User",
        },
        channel:{
            type: Schema.Types.ObjectId,//one to whom subscriber is subscribing
            ref: "User"
        }
    },
    {timestamps:true}
)

export const Subscription = mongoose.model("Subscription",subcriptionSchema)