import { Router } from 'express';

import NotifyRoutes from './routes/notify.routes';

const notifyModule = Router();
notifyModule.use('/notify', NotifyRoutes);
export default notifyModule;
