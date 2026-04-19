import express from "express";
import { userSchema } from "./validations/userValidations";
import { UserModel } from "./db";
import bcrypt from "bcrypt";
import "./db";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(express.json());

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
            message : "SignUp SuccessFul!",
            token,
        });
    }
    catch(error){
        return res.status(500).json({
            message : "Server Side Error !"
        })
    }
})

app.post("/content",(req,res) => {

})

app.get("/content",(req,res) => {

})

app.delete("/content",(req,res) => {

})

app.post("/brain/share",(req,res) => {

})

app.get("/brain/sharedLink",(req,res) => {

})

app.listen(3000, () => {
  console.log("Server running on port 3000");
});