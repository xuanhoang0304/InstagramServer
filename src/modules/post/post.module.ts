import { Router } from 'express';
import postRoutes from './routes/post.routes';
import CommentRoutes from './routes/comment.routes';

const postModule = Router();
postModule.use('/posts', postRoutes);
postModule.use('/comments', CommentRoutes);

export default postModule;
