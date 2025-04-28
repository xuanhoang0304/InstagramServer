import { Router } from 'express';
import userRoutes from './routes/user.routes';

const userModule = Router();
userModule.use('/users', userRoutes);

export default userModule;
