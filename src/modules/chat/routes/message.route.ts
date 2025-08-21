import { Router } from 'express';
import passport from 'passport';
import asyncHandler from '~/middlewares/asyncHandler';
import { validate } from '~/middlewares/validate.middleware';

import { MessageController } from '../controllers/message.controller';
import { createMessage } from '../validators/message.validator';

const messageRoutes = Router();
const messageController = new MessageController();

messageRoutes.post(
  '/',
  passport.authenticate('jwt', {
    session: false,
  }),
  validate(createMessage),
  asyncHandler(messageController.createMessage),
);
messageRoutes.get(
  '/',
  passport.authenticate('jwt', {
    session: false,
  }),
  asyncHandler(messageController.getPagination),
);
messageRoutes.delete(
  '/:msgId',
  passport.authenticate('jwt', {
    session: false,
  }),
  asyncHandler(messageController.DeleteMessage),
);
export default messageRoutes;
