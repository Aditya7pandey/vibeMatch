import prisma from "@repo/db";
import { NextFunction,Request,Response } from "express";

const retrieveMessages = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        const {conversationId} = req.params;

        const messages = await prisma.messages.findMany({
            where:{
                conversationId:conversationId?.toString()
            },
            orderBy:{
                createdAt:'asc'
            }
        })

        return res.status(200).json({
            messages:messages
        })

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

const sendMessages = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        

    } catch (error) {
        if(error instanceof Error){
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

const directConversation = async (req:Request,res:Response) =>{
    try {
        const userId = (req as any).user.id;
        const {receiverId} = req.params;

        const conversation = await prisma.conversation.create({
            data:{
                type:"DIRECT",
                name:
            }
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
    retrieveMessages,
    sendMessages,
    directConversation
}