import express,{Router} from 'express'
import { changeRole, directConversation, getMessages, groupCreate, leaveGroup, sendMessages } from '../controllers/messages.js';
import authMiddleware from '../middlewares/auth.middlewars.js';

const router:Router = express.Router();

router.get('/:conversationId',authMiddleware,getMessages);

router.post('/direct-conversation/:receiverId',authMiddleware,directConversation);

router.post('/create-group',authMiddleware,groupCreate);

router.post('/send-messages/:conversationId',authMiddleware,sendMessages);

router.delete('/leave-group',authMiddleware,leaveGroup);

router.patch('/group/role',authMiddleware,changeRole)

export default router;