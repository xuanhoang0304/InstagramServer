import { Router } from 'express';
import passport from 'passport';
import { UploadImageClient, UploadVideoClient } from '~/config/cloudinary';
import asyncHandler from '~/middlewares/asyncHandler';
import { validate } from '~/middlewares/validate.middleware';

import { UploadController } from '../controllers/upload.controller';
import { removeFileSchema2 } from '../validators/upload.validator';

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
  validate(removeFileSchema2),
  UploadController.removeFile,
);

export default router;
