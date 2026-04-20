import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req:Request, res:Response, next:NextFunction) =>{
    try{
        const token = req.headers.authorization;
        if(!token){
            return res.status(403).json({
                message : "Token Missing! "
            });
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_USER_PASSWORD as string
        ) as {id : string}
        (req as any).userId = decoded.id;
        next();
    }
    catch(error){
        return res.status(403).json({
            message: "Invlaid token"
        });
    }
}
