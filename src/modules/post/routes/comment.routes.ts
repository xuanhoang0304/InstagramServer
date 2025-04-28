import { Router } from 'express';

import passport from 'passport';
import asyncHandler from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import {
  createCommentSchema,
  createReplyCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validator';
import { CommentController } from '../controllers/comment.controller';

const CommentRoutes = Router();
const commentController = new CommentController();
// get Replies by ParentCommentId
CommentRoutes.get(
  '/:commentId/replies',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(commentController.getReplies),
);

CommentRoutes.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  validate(createCommentSchema),
  asyncHandler(commentController.create),
);

CommentRoutes.post(
  '/:commentId/reply',
  passport.authenticate('jwt', { session: false }),
  validate(createReplyCommentSchema),
  asyncHandler(commentController.createReply),
);

CommentRoutes.put(
  '/:commentId',
  passport.authenticate('jwt', { session: false }),
  validate(updateCommentSchema),
  asyncHandler(commentController.update),
);

CommentRoutes.delete(
  '/:commentId',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(commentController.delete),
);

export default CommentRoutes;
