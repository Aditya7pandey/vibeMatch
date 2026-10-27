import prisma from "@repo/db";
import { NextFunction, Request, Response } from "express";

const sendMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;
        const { message } = req.body;

        if (!conversationId || !userId || !message) {
            return res.status(400).json({
                message: "all inputs are needed"
            })
        }

        const exist = await prisma.conversation_members.findFirst({
            where: {
                userId: userId
            }
        })

        if (!exist) {
            return res.status(400).json({
                message: "invalid group or conversation"
            })
        }

        await prisma.messages.create({
            data: {
                senderId: userId,
                conversationId: conversationId?.toString(),
                content: message,
            }
        })

        return res.status(200).json({
            message: "message created"
        })

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                error: error.message
            })
        }
    }
}

const directConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { receiverId } = req.params;

        if (!receiverId || receiverId === userId) {
            return res.status(400).json({
                error: "Invalid receiver"
            })
        }

        const excisting = await prisma.conversation.findFirst({
            where: {
                type: "DIRECT",
                AND: [
                    { conversationMembers: { some: { userId } } },
                    { conversationMembers: { some: { userId: receiverId } } }
                ]
            }
        })

        if (excisting) {
            return res.status(200).json({
                conversation: excisting
            })
        }

        const conversation = await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                // till then you can push userid here but replace with the name 
                // by changing some token details
                created_by: userId,
                conversationMembers: {
                    create: [
                        { userId, role: 'MEMBER', joined_at: new Date },
                        { userId: receiverId, role: 'MEMBER', joined_at: new Date }
                    ]
                }
            }
        })

        return res.status(200).json({
            conversation,
            message: "direct communication created"
        })

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                error: error.message
            })
        }
    }
}

const groupCreate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id
        const { membersId, name } = req.body as { membersId?: unknown; name?: string };

        if (!name) {
            return res.status(400).json({
                message: "name is required for the group"
            })
        }

        if (!Array.isArray(membersId)) {
            return res.status(400).json({
                message: "membersId must be an array of user ids"
            })
        }

        const validMemberIds = [...new Set(membersId.filter((id): id is string => typeof id === "string"))];
        const others = validMemberIds.filter((id) => id !== userId);

        if (others.length < 1) {
            return res.status(400).json({
                message: "add atleast one member in the group"
            })
        }

        const conversation = await prisma.conversation.create({
            data: {
                type: 'GROUP',
                name: name,
                // till then you can push userid here but replace with the name 
                // by changing some token details
                created_by: userId,
                conversationMembers: {
                    create: [
                        { userId, role: "ADMIN" as const, joined_at: new Date() },
                        ...others.map((id) => ({ userId: id, role: "MEMBER" as const, joined_at: new Date() })),
                    ],
                }
            },
            include: { conversationMembers: true }
        })

        return res.status(201).json({
            conversation
        })

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                error: error.message
            })
        }
    }
}

const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;

        const exist = await prisma.conversation_members.findFirst({
            where: {
                userId,
                conversationId: conversationId?.toString()
            }
        })

        if (!exist) {
            return res.status(400).json({
                message: "unauthorized or invalid group"
            })
        }

        const messages = await prisma.messages.findMany({
            where: {
                conversationId: conversationId?.toString()
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        return res.status(200).json({
            message: "messages retrieved",
            messages
        })

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                error: error.message
            })
        }
    }
}

const leaveGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;

        if(!conversationId || typeof(conversationId) !== 'string'){
            return res.status(404).json({
                message:"conversation not found"
            })
        }

        const member = await prisma.conversation_members.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        })

        if (!member) {
            return res.status(400).json({
                message: "user is already not the member of the group"
            })
        }

        if (member.role === 'ADMIN') {
            return res.status(400).json({
                message: "user has to assign someone as an admin"
            })
        }

        await prisma.conversation_members.delete({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        })

        return res.status(200).json({
            message: "user leaved the group"
        })

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({
                error: error.message
            })
        }
    }
}

const changeRole = async(req:Request,res:Response) =>{
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;
        const {receiverId} = req.body;

        if(!conversationId || typeof(conversationId) !== 'string'){
            return res.status(404).json({
                message:"conversation not found"
            })
        }

        if(!receiverId){
            return res.status(404).json({
                message:"receiverId not found"
            })
        }

        const member = await prisma.conversation_members.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                },
            }
        })

        const receiver = await prisma.conversation_members.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId:receiverId
                },
            }
        })

        if (!member || !receiver) {
            return res.status(400).json({
                message: "user or receiver is not in the group"
            })
        }

        if(member.role === 'MEMBER' || receiver.role === 'ADMIN'){
            return res.status(400).json({
                message:"Invalid request member cannot make admin"
            })
        }

        await prisma.conversation_members.update({
            where:{
                conversationId_userId:{
                    conversationId,
                    userId
                }
            },
            data:{
                role:'MEMBER'
            }
        })

        await prisma.conversation_members.update({
            where:{
                conversationId_userId:{
                    conversationId,
                    userId:receiverId
                }
            },
            data:{
                role:'ADMIN'
            }
        })

        return res.status(200).json({
            messsage:"status changed"
        })

    } catch (error) {
        if(error instanceof Error) {
            return res.status(500).json({
                error:error.message
            })
        }
    }
}

export {
    sendMessages,
    directConversation,
    groupCreate,
    getMessages,
    leaveGroup,
    changeRole
}