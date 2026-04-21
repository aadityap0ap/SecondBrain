import express,{Request,Response} from "express";
import { contentSchema, userSchema } from "./validations/userValidations";
import { contentModel, TagModel, UserModel } from "./db";
import bcrypt from "bcrypt";
import "./db";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
import { authMiddleware } from "./validations/middleware";

import mongoose from "mongoose";
dotenv.config();


const app = express();
app.use(express.json());

interface AuthRequest extends Request {
  userId?: string;
}

app.post("/signup",async (req,res) => {
    try{
        const result = userSchema.safeParse(req.body);
        if(!result.success){
            return res.status(411).json({
                message:"Invalid Inputs",
                errors : result.error.issues,
            });
        }
        const {username,password} = result.data;
        
        const existingUser = await UserModel.findOne({username});
        if(existingUser){
            return res.status(403).json({
                message : "User already existed with this username !",
            });
        }
        const hashedPassword = await bcrypt.hash(password,9);
        await UserModel.create({
            username,
            password : hashedPassword,
        });
        return res.status(200).json({
            message: "You are signed up successfully!"
        })
    }
    catch(error){
        return res.status(500).json({
            message : "Server Side Error",
        })
    }
})

app.post("/signin",async(req,res) => {
    const {username,password} = req.body;
    try{
        const User = await UserModel.findOne({username});
        if(!User){
            return res.status(411).json({
                message : "Invalid username! ",
            });
        }
        const isMatched = await bcrypt.compare(password,User.password as string);
        if(!isMatched){
            return res.status(411).json({
                message : "Invalid Password!"
            })
        }
        const token = jwt.sign({
            id : User._id,
        },process.env.JWT_USER_PASSWORD as string);
        res.status(200).json({
            message : "SignIn SuccessFul!",
            token,
        });
    }
    catch(error){
        return res.status(500).json({
            message : "Server Side Error !"
        })
    }
})

app.post("/content",authMiddleware,async(req:AuthRequest,res : Response) => {
    try{
        const content = contentSchema.safeParse(req.body);
        if(!content.success){
            return res.status(411).json({
                message : "Invalid Inputs",
                errors : content.error.issues,
            })
        }
        if (!req.userId) {
        return res.status(403).json({
        message: "Unauthorized",
        });
       }

        const{type,link,title,tags} = content.data;
        const tagIds: mongoose.Types.ObjectId[] = [];
        for(const tagTitle of tags){
            let tag = await TagModel.findOne({title : tagTitle});
            if(!tag){
                tag = await TagModel.create({title : tagTitle});
            }
            tagIds.push(tag._id as mongoose.Types.ObjectId);
        }
        
        await contentModel.create({
            type,
            link,
            title,
            tags : tagIds,
            userId : req.userId,
        });
        return res.status(200).json({
            message : "Contents Saved SuccessFully!"
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            message : "Server Side Error"
        })
    }
})

app.get("/content",authMiddleware,async(req : AuthRequest,res : Response) => {
    try{
        if(!req.userId){
            return res.status(403).json({
                message : "You are not authorized to access this!"
            })
        }
        const contents = await contentModel
        .find({ userId: req.userId })
        .populate("tags", "title")  // only tag title
        .select("title link type tags"); // only these fields
        return res.status(200).json({
            message : "All Contents Fetched Successfully!",
            contents
        })
    }
    catch(error){
        return res.status(500).json({
            message : "Server Side Error"
        })
    }
})

app.delete("/content/:id",authMiddleware,async(req : AuthRequest,res : Response) => {
    try{
        if(!req.userId){
            return res.status(403).json({
                message : "You are not authorzed to delete the content!"
            })
        }
        const contentId = req.params.id;
        const deleted = await contentModel.deleteOne({
            _id : contentId,
            userId : req.userId,       
        });
        if(deleted.deletedCount === 0){
            return res.status(404).json({
                message : "Content not found or Unauthorized!"
            })
        }
        return res.status(200).json({
            message : "Content Deleted SuccessFully!"
        })
    }
    catch(error){
        res.status(500).json({
            message : " Server Side Error"
        })
    }
})

app.post("/brain/share",(req,res) => {

})

app.get("/brain/sharedLink",(req,res) => {

})

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

