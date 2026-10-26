import { Request,Response,NextFunction } from "express";
import jwt from 'jsonwebtoken'

type AuthRequest = Request & {
    user?:{id:string}
}

const authMiddleware = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        /*
         nikaluga access token
         check of refresh token if availble
         if not i will discard this request
         if yes
         user id le lunga
         db mai check karunga
        approve kar duna */

        /* 
        access token ko nikalo
        jwt secret se verify karo
        aur agge send karo */

        const authHeader = req.headers.authorization || req.headers.authorization
        const header = Array.isArray(authHeader)?authHeader[0]:authHeader;

        if(!header?.startswith('Bearer ')){
            return res.status(401).json({
                message:"Unauthorized"
            })
        }

        const token = header!.split(' ')[1];
        if(!token) return res.json({
            message:'Unauthorized'
        })

        jwt.verify(token as string,process.env.ACCESS_JWT_SECRET!,(err,decoded)=>{
            if(err){
                return res.json({
                    message:"unauthorized"
                })
            }
            
            (req as AuthRequest).user = decoded as {id:string}
            next();
        })

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

export default authMiddleware;