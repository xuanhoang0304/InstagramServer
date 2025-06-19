import { Router } from 'express';

import groupRoutes from './routes/group.route';
import messageRoutes from './routes/message.route';

const chatModule = Router();
chatModule.use('/groups', groupRoutes);
chatModule.use('/chats', messageRoutes);
export default chatModule;
