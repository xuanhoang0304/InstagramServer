import { Router } from 'express';

import passport from 'passport';

import { UploadController } from '../controllers/upload.controller';

import { UploadImageClient, UploadVideoClient } from '@/config/cloudinary';
import asyncHandler from '@/middlewares/asyncHandler';

import { removeFileSchema } from '../validators/upload.validator';
import { validate } from '@/middlewares/validate.middleware';

const router = Router();

router.post(
  '/video',
  passport.authenticate('jwt', { session: false }),
  UploadVideoClient.single('video'),
  asyncHandler(UploadController.uploadVideo),
);

router.post(
  '/image',
  UploadImageClient.single('image'),
  asyncHandler(UploadController.uploadImage),
);

router.delete(
  '/by-paths',
  passport.authenticate('jwt', { session: false }),
  validate(removeFileSchema),
  UploadController.removeFile,
);

export default router;
