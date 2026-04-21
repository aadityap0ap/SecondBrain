// import { Request,Response,NextFunction } from "express";
// import jwt from "jsonwebtoken";

// export const authMiddleware = (req:Request, res:Response, next:NextFunction) =>{
//     try{
//         const token = req.headers.authorization;
//         if(!token){
//             return res.status(403).json({
//                 message : "Token Missing! "
//             });
//         }
//         const decoded = jwt.verify(
//             token,
//             process.env.JWT_USER_PASSWORD as string
//         ) as {id : string}
//         (req as any).userId = decoded.id;
//         next();
//     }
//     catch(error){
//         return res.status(403).json({
//             message: "Invlaid token"
//         });
//     }
// }
//the above is not 100% type secure...

import {Request,Response,NextFunction} from "express";
import jwt from "jsonwebtoken";

//define custom interface 
//why doing so
// Step 1: Define custom request interface
// Why?
// Express's default Request type does NOT have a `userId` property.
// But in our middleware, we are attaching `userId` after verifying JWT.
//
// So we extend the Request type to include `userId`,
// allowing TypeScript to understand that this property exists.

interface AuthRequest extends Request {
  userId?: string; 
}

export const authMiddleware = (req : AuthRequest,res : Response,next:NextFunction)=>{
    try{
        const token = req.headers.authorization ?.split(" ")[1];
        if(!token){
            return res.status(403).json({
                message : "Token Missing! "
            })
        }
        interface jwtpayload{
            id:string;
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_USER_PASSWORD as string
        ) as jwtpayload;
        req.userId = decoded.id;
        next();
    }
    catch(error){
        return res.status(403).json({
            message : "Invalid Token!"
        })
    }
}
