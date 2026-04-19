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

export const UserModel = model("Users",userSchema);
