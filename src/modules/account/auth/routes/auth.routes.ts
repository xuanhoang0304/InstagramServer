import { Router } from 'express';
import passport from 'passport';
import ConfignEnv from '~/config/env';
import asyncHandler from '~/middlewares/asyncHandler';
import { validate } from '~/middlewares/validate.middleware';
import { LoginSchema } from '~/modules/account/auth/validators/auth.validators';
import { otpSchema, VerifyOtpSchema } from '~/modules/account/otp/validator/otp.validator';

import { IUser } from '../../user/model/user.model';
import { AuthControllers } from '../controllers/auth.controllers';
import { AuthServices } from '../services/auth.services';

const AuthRoutes = Router();
const AuthController = new AuthControllers();

AuthRoutes.post('/login', validate(LoginSchema), asyncHandler(AuthController.Login));
AuthRoutes.get(
  '/@me',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(AuthController.getMe),
);
AuthRoutes.post('/send-otp', validate(otpSchema), asyncHandler(AuthController.SendOtp));
AuthRoutes.post('/refresh-token', asyncHandler(AuthController.RefreshToken));
AuthRoutes.post('/verify-otp', validate(VerifyOtpSchema), asyncHandler(AuthController.VerifyOtp));
AuthRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
AuthRoutes.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req: any, res) => {
    const user = req.user as IUser;
    const accessToken = AuthServices.signJWT(user, '15m');
    const refreshToken = AuthServices.signJWT(user, '7d');

    res.redirect(
      `${
        process.env.NODE_ENV === 'production'
          ? String(ConfignEnv.FRONTEND_URL)
          : 'http://localhost:3000'
      }/auth/google-callback?accessToken=${accessToken}&refreshToken=${refreshToken}${req.temp && `&newUser=${req.temp._id}`}`,
    );
  },
);
AuthRoutes.post('/check-token', asyncHandler(AuthController.checkToken));
AuthRoutes.get(
  '/logout',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(AuthController.Logout),
);
export default AuthRoutes;
