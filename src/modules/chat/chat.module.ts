import { Router } from 'express';
import groupRoutes from './routes/group.route';

const chatModule = Router();
chatModule.use('/groups', groupRoutes);

export default chatModule;
