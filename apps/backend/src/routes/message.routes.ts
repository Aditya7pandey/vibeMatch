import express,{Router} from 'express'
import { retrieveMessages } from '../controllers/messages.js';

const router:Router = express.Router();

router.get('/messages/:conversationId',retrieveMessages);

router.post('/direct-conversation/:receiverId',);

export default router;