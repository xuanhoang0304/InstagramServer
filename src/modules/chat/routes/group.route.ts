import { Router } from 'express';
import passport from 'passport';

import asyncHandler from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate.middleware';

import { GroupController } from '../controllers/group.controller';
import {
  creatGroupSchema,
  updateGroupInfoSchema,
  updateGroupMemberSchema,
} from '../validators/group.validator';

const groupRoutes = Router();
const groupController = new GroupController();
// Lấy group chat của curUserId
groupRoutes.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(groupController.getGroups),
);
// Lấy group chat by groupId
groupRoutes.get(
  '/:groupId',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(groupController.getById),
);
// Tạo 1 group chat
groupRoutes.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  validate(creatGroupSchema),
  asyncHandler(groupController.create),
);
// Update Group : Thêm thành viên
groupRoutes.put(
  '/:groupId/members',
  passport.authenticate('jwt', { session: false }),
  validate(updateGroupMemberSchema),
  asyncHandler(groupController.addMembers),
);
// Update Group : Xóa thành viên
groupRoutes.put(
  '/:groupId/delete-members',
  passport.authenticate('jwt', { session: false }),
  validate(updateGroupMemberSchema),
  asyncHandler(groupController.deleteMembers),
);
// Update Group: Update info group
groupRoutes.put(
  '/:groupId/update',
  passport.authenticate('jwt', { session: false }),
  validate(updateGroupInfoSchema),
  asyncHandler(groupController.updateGroup),
);
// Delete group chat : Người tạo group xóa đi group chat này
groupRoutes.delete(
  '/:groupId',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(groupController.deleteGroup),
);

export default groupRoutes;
