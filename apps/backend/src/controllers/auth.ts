import { Request,Response } from "express"
import prisma from "@repo/db"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const accessTokenGenerator = (id:string) =>{
    return jwt.sign({id:id},process.env.ACCESS_JWT_SECRET!,{
        expiresIn:"15m"
    })
}

const refreshTokenGenerator = (id:string) =>{
    return jwt.sign({id:id},process.env.REFRESH_JWT_SECRET!,{
        expiresIn:"7d"
    })
}

const refreshCookieOptions = {
    secure:process.env.NODE_ENV === "production",
    httpOnly:true,
    sameSite:'strict' as const
}

const handleError = (res:Response,error:unknown) =>{
    return res.status(500).json({
        error:error instanceof Error ? error.message : "internal server error"
    })
}

const signup = async (req:Request,res:Response) =>{
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message:"email or password not found"
            })
        }

        let user = await prisma.user.findFirst({
            where:{
                email:email
            }
        })

        if(user){
            return res.status(409).json({
                message:"user already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);

        user = await prisma.user.create({
            data:{
                email:email,
                password:hashedPassword
            }
        })

        const accessToken = accessTokenGenerator(user.id);
        const refreshToken = refreshTokenGenerator(user.id);

        res.cookie('refreshToken',refreshToken,refreshCookieOptions)

        return res.status(201).json({
            message:"user signed up successfully",
            accessToken
        })

    } catch (error) {
        return handleError(res,error)
    }
}

const login = async (req:Request,res:Response) =>{
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message:"email or password not found"
            })
        }

        let user = await prisma.user.findFirst({
            where:{
                email
            }
        })

        // same response for unknown email and wrong password, so emails can't be enumerated
        if(!user || !(await bcrypt.compare(password,user.password))){
            return res.status(401).json({
                message:"user email or password not correct"
            })
        }

        const accessToken = accessTokenGenerator(user.id);
        const refreshToken = refreshTokenGenerator(user.id);

        res.cookie('refreshToken',refreshToken,refreshCookieOptions)

        return res.status(200).json({
            message:"user logged in successfully",
            accessToken
        })

    } catch (error) {
        return handleError(res,error)
    }
}

const logout = async (req:Request,res:Response) => {
    try {
        res.clearCookie('refreshToken',refreshCookieOptions)

        return res.json({
            message:"logged out successfully"
        })

    } catch (error) {
        return handleError(res,error)
    }
}

export {
    signup,
    login,
    logout
}
