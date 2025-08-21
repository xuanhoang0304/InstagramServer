import { Router } from 'express';
import passport from 'passport';
import asyncHandler from '~/middlewares/asyncHandler';
import { validate } from '~/middlewares/validate.middleware';

import { PostController } from '../controllers/post.controller';
import { CreatPostSchema, updatePostSchema } from '../validators/post.validator';

const postRoutes = Router();
const postController = new PostController();

// Discover Posts
postRoutes.get(
  '/discover',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.getDiscoverPosts),
);

// Lấy những bài post của user mà bạn follow
postRoutes.get(
  '/following',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.getPostsByFollowing),
);

// Lấy Parentcomment của 1 bài post
postRoutes.get(
  '/:id/comments',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.getCommentsByPostId),
);

// Lấy bài post theo postId
postRoutes.get(
  '/:postId',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.getPostByPostId),
);

// Lấy danh sách posts (route gốc)
postRoutes.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.getPagination),
);

// Tạo 1 bài post
postRoutes.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  validate(CreatPostSchema),
  asyncHandler(postController.create),
);

// Update bài post
postRoutes.put(
  '/:postId',
  passport.authenticate('jwt', { session: false }),
  validate(updatePostSchema),
  asyncHandler(postController.update),
);

// Delete bài post
postRoutes.delete(
  '/:postId',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(postController.delete),
);

export default postRoutes;
