import { Router } from 'express';

import passport from 'passport';
import asyncHandler from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { RegisterUserSchema } from '../validators/user.validator';
import { UserController } from '../controllers/user.controller';

const userRoutes = Router();
const userController = new UserController();
// Get suggestion user without folllow
userRoutes.get(
  '/explore',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(userController.getExploreUsers),
);
// Register User
userRoutes.post('/', validate(RegisterUserSchema), asyncHandler(userController.registerUser));
// Follow / Unfollow user
userRoutes.put(
  '/:id/follow',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(userController.followUser),
);
// Save / UnSave 1 bài post
userRoutes.put(
  '/:postId/save',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(userController.savePost),
);
// Like / UnLike 1 bài post
userRoutes.put(
  '/:postId/like',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(userController.likePost),
);
export default userRoutes;
