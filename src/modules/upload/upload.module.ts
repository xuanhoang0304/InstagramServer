import { Router } from 'express';

import uploadRouter from './routes/upload.routes';

const uploadModule = Router();

uploadModule.use('/upload', uploadRouter);

export default uploadModule;
