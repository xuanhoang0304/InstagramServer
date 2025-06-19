import * as cookie from 'cookie';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

import ConfignEnv from '@/config/env';
import { CustomCookies } from '@/types/types';
import { tryParseCookie } from '@/utils/helpers';

import { HttpResponse } from '../../../../utils/httpResponse';
import { UserService } from '../../user/services/user.service';
import { LoginDTO } from '../dtos/auth.dtos';
import { AuthServices } from '../services/auth.services';

export class AuthControllers {
  async getMe(req: Request, res: Response) {
    const cookieHeader = req.headers.cookie;
    const cookies: CustomCookies = tryParseCookie(String(cookieHeader));
    const { accessToken, refreshToken } = cookies;
    const decoded = jwt.verify(
      String(refreshToken) || String(accessToken),
      ConfignEnv.JWT_SECRET,
    ) as JwtPayload & {
      id: string;
    };

    const user = await UserService.getById(decoded.id);

    res.status(StatusCodes.OK).json(HttpResponse.Paginate({ user, accessToken, refreshToken }));
  }
  async Login(req: Request, res: Response) {
    const data: LoginDTO = req.body;
    const result = await AuthServices.Login(data);
    const cookies: string[] = [];

    if (result.refreshToken) {
      cookies.push(
        cookie.serialize('refreshToken', String(result.refreshToken), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 7 ngày
          path: '/',
        }),
      );
    }
    if (result.accessToken) {
      cookies.push(
        cookie.serialize('accessToken', String(result.accessToken), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 15, // 15 phut
          httpOnly: true,
          path: '/',
        }),
      );
    }

    // Set tất cả cookie cùng một lúc
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
    res.status(200).json(HttpResponse.login(result));
  }
  async SendOtp(req: Request, res: Response) {
    const { email, typeOTP } = req.body;
    await AuthServices.sendOtp(email, typeOTP);
    res.status(200).json({
      message: 'Sent OTP!',
      code: 200,
    });
  }
  async VerifyOtp(req: Request, res: Response) {
    const { otp, email } = req.body;
    const result = await AuthServices.verifyOtp(otp, email);
    res.status(200).json({
      message: 'OTP valid!',
      code: 200,
      result,
    });
  }
  async RefreshToken(req: Request, res: Response) {
    const refreshToken = req.headers.authorization?.split(' ')[1] as string;
    const result = await AuthServices.RefreshToken(refreshToken);

    const cookies: string[] = [];

    if (result) {
      cookies.push(
        cookie.serialize('accessToken', String(result), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 15, // 15 phut
          httpOnly: true,
          path: '/',
        }),
      );
    }

    // Set tất cả cookie cùng một lúc
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
    res.status(200).json({
      code: 200,
      message: 'Token refreshed successfully',
      data: result,
    });
  }
  async checkToken(req: Request, res: Response) {
    const { token } = req.body;
    const result = await AuthServices.checkToken(token);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async Logout(req: Request, res: Response) {
    const cookieHeader = req.headers.cookie;
    const { refreshToken } = tryParseCookie(String(cookieHeader));
    const result = await AuthServices.Logout(String(refreshToken));
    const cookies: string[] = [];

    if (result.refreshToken === '') {
      cookies.push(
        cookie.serialize('refreshToken', String(result.refreshToken), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(0),
          path: '/',
        }),
      );
    }
    if (result.accessToken === '') {
      cookies.push(
        cookie.serialize('accessToken', String(result.accessToken), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(0),
          path: '/',
        }),
      );
    }
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
}
