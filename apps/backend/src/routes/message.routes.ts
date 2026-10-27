import express,{Router} from 'express'
import { directConversation, getMessages, groupCreate } from '../controllers/messages.js';

const router:Router = express.Router();

router.get('/messages/:conversationId',getMessages);

router.post('/direct-conversation/:receiverId',directConversation);

router.post('/create-group',groupCreate);

export default router;