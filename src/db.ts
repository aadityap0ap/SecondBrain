import mongoose from "mongoose";
import {model,Schema} from "mongoose";

import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  throw new Error("MONGO_URL is not defined");
}
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

  
const userSchema = new Schema({
    username : {type:String,unique:true},
    password : String
})

const contentSchema = new Schema({
  type : {type : String,
    enum : ["document","tweet","youtube","link"],
    requird : true,
  },
  link : {
    type : String,
    requird : true,
  },
  title : {
    type : String,
    required : true,
  },
  tags : {
    type : [String],
    required : true,
  }
})

export const contentModel = model("Content",contentSchema);
export const UserModel = model("Users",userSchema);
