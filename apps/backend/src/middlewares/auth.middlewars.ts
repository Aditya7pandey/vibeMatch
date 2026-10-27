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

        const header = req.headers.authorization;

        if(typeof header !== 'string' || !header.startsWith('Bearer ')){
            return res.status(401).json({
                message:"Unauthorized"
            })
        }

        const token = header.split(' ')[1];
        if(!token){
            return res.status(401).json({
                message:'Unauthorized'
            })
        }

        let decoded;
        try {
            decoded = jwt.verify(token,process.env.ACCESS_JWT_SECRET!) as {id:string}
        } catch {
            return res.status(401).json({
                message:"unauthorized"
            })
        }

        (req as AuthRequest).user = {id:decoded.id}
        next();

    } catch (error) {
        console.log(error instanceof Error ? error.message : error)
        return res.status(500).json({
            error:error instanceof Error ? error.message : "internal server error"
        })
    }
}

export default authMiddleware;