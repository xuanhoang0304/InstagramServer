import * as cookie from 'cookie';
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
  // passport.authenticate('jwt', { session: false }),
  asyncHandler(AuthController.getMe),
);
AuthRoutes.post('/send-otp', validate(otpSchema), asyncHandler(AuthController.SendOtp));
AuthRoutes.get(
  '/refresh-token',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(AuthController.RefreshToken),
);
AuthRoutes.post('/verify-otp', validate(VerifyOtpSchema), asyncHandler(AuthController.VerifyOtp));
AuthRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
AuthRoutes.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user as IUser;
    const token = AuthServices.signJWT(user, '15m');
    const refreshToken = AuthServices.signJWT(user, '7d');
    const cookies: string[] = [];

    if (refreshToken) {
      cookies.push(
        cookie.serialize('refreshToken', String(refreshToken), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          domain: 'instagram-client-brown.vercel.app',
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          path: '/',
        }),
      );
    }
    if (token) {
      cookies.push(
        cookie.serialize('accessToken', String(token), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          domain: 'instagram-client-brown.vercel.app',
          maxAge: 60 * 15,
          httpOnly: true,
          path: '/',
        }),
      );
    }
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
    res.redirect(
      `${process.env.NODE_ENV === 'production' ? ConfignEnv.FRONTEND_URL : 'http://localhost:3000'}/api/auth/google-callback?token=${token}&refreshToken=${refreshToken}`,
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
