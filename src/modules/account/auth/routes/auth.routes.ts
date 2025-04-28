import { Router } from 'express';
import passport from 'passport';
import * as cookie from 'cookie';
import { AuthControllers } from '../controllers/auth.controllers';
import { validate } from '@/middlewares/validate.middleware';
import asyncHandler from '@/middlewares/asyncHandler';
import { VerifyOtpSchema, otpSchema } from '@/modules/account/otp/validator/otp.validator';
import { AuthServices } from '../services/auth.services';
import { IUser } from '../../user/model/user.model';
import { LoginSchema } from '@/modules/account/auth/validators/auth.validators';

const AuthRoutes = Router();
const AuthController = new AuthControllers();

AuthRoutes.post('/login', validate(LoginSchema), asyncHandler(AuthController.Login));
AuthRoutes.get(
  '/@me',
  passport.authenticate('jwt', { session: false }),
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
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        }),
      );
    }
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
    res.redirect(
      `http://localhost:3000/auth/google-callback?token=${token}&refreshToken=${refreshToken}`,
    );
  },
);
export default AuthRoutes;
