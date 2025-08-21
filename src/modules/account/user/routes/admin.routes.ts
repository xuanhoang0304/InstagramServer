import { Router } from 'express';
import asyncHandler from '~/middlewares/asyncHandler';
import {
  authAdminMiddleware,
  checkPerrmissionMiddleware,
} from '~/middlewares/authAdmin.middleware';
import { validate } from '~/middlewares/validate.middleware';

import { AdminController } from '../controllers/admin.controller';
import { EPermissions } from '../model/permission.model';
import { CreateAdminSchema, LoginAdminSchema } from '../validators/admin.validator';

const adminRoutes = Router();
const adminController = new AdminController();

adminRoutes.post(
  '/',
  authAdminMiddleware,
  checkPerrmissionMiddleware(EPermissions.ManageAdmin),
  validate(CreateAdminSchema),
  asyncHandler(adminController.create),
);
adminRoutes.post('/login', validate(LoginAdminSchema), asyncHandler(adminController.login));
adminRoutes.get('/@me', authAdminMiddleware, asyncHandler(adminController.getMe));

export default adminRoutes;
