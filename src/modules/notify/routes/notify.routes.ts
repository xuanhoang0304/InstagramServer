import { Router } from 'express';
import passport from 'passport';
import asyncHandler from '~/middlewares/asyncHandler';

import { NotifyController } from '../controllers/notify.controller';

const NotifyRoutes = Router();
const notifyController = new NotifyController();
NotifyRoutes.get(
  '/',
  passport.authenticate('jwt', {
    session: false,
  }),
  asyncHandler(notifyController.getPagination),
);

export default NotifyRoutes;
