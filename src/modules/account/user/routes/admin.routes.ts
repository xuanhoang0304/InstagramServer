import { Router } from 'express';

import asyncHandler from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';
import { CreateAdminSchema, LoginAdminSchema } from '../validators/admin.validator';
import { AdminController } from '../controllers/admin.controller';
import {
  authAdminMiddleware,
  checkPerrmissionMiddleware,
} from '@/middlewares/authAdmin.middleware';
import { EPermissions } from '../model/permission.model';

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
