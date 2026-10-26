import { Request,Response } from "express"
import prisma from "@repo/db"
import bcrypt, { hash } from 'bcrypt'
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

const signup = async (req:Request,res:Response) =>{
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.json({
                message:"email or password not found"
            })
        }

        let user = await prisma.user.findFirst({
            where:{
                email:email
            }
        })

        if(user){
            return res.json({
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

        res.cookie('refreshToken',{refreshToken},{
            secure:true ? process.env.NODE_ENV === "development":false,
            httpOnly:true,
            sameSite:'strict'
        })

        return res.status(200).json({
            message:"user signed up successfully",
            accessToken
        })

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

const login = async (req:Request,res:Response) =>{
    try {
        const {email,password} = req.body;

        let user = await prisma.user.findFirst({
            where:{
                email
            }
        })

        if(!user){
            return res.json({
                message:"user not found"
            })
        }

        const ifUser = await bcrypt.compare(user.password,password);

        if(!ifUser){
            return res.json({
                message:"user email or password not correct"
            })
        }

        const accessToken = accessTokenGenerator(user.id);
        const refreshToken = refreshTokenGenerator(user.id);

        res.cookie('refreshToken',{refreshToken},{
            secure:true ? process.env.NODE_ENV === "development":false,
            httpOnly:true,
            sameSite:'strict'
        })

        return res.status(200).json({
            message:"user logged in successfully",
            accessToken
        })

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

const logout = async (req:Request,res:Response) => {
    try {
        res.clearCookie('refreshToken',{
            httpOnly:true,
            sameSite:'strict',
            secure:true ? process.env.NODE_ENV === "development":false
        })

        return res.json({
            message:"logged out successfully"
        })

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

export {
    signup,
    login,
    logout
}