import { Router } from 'express';
import adminRoutes from './routes/admin.routes';

const adminModule = Router();
adminModule.use('/admins', adminRoutes);

export default adminModule;
