import { Router } from 'express';
import AuthRoutes from './routes/auth.routes';

const authModule = Router();
authModule.use('/auth', AuthRoutes);

export default authModule;
