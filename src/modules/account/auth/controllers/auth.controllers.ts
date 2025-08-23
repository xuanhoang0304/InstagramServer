import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import ConfignEnv from '~/config/env';

import { HttpResponse } from '../../../../utils/httpResponse';
import { UserService } from '../../user/services/user.service';
import { LoginDTO } from '../dtos/auth.dtos';
import { AuthServices } from '../services/auth.services';

export class AuthControllers {
  async getMe(req: Request, res: Response) {
    const { accessToken, refreshToken } = req.cookies;
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
    const refreshToken = req?.cookies.refreshToken;
    const result = await AuthServices.RefreshToken(refreshToken as string, res);
    if (result) {
      res.cookie('accessToken', result, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
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
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    // const refreshToken = req.cookies.refreshToken;
    // const result = await AuthServices.Logout(String(refreshToken));
    // const cookies: string[] = [];

    // if (result.refreshToken === '') {
    //   cookies.push(
    //     cookie.serialize('refreshToken', String(result.refreshToken), {
    //       secure: true,
    //       sameSite: 'none',
    //       expires: new Date(0),
    //       path: '/',
    //     }),
    //   );
    // }
    // if (result.accessToken === '') {
    //   cookies.push(
    //     cookie.serialize('accessToken', String(result.accessToken), {
    //       secure: true,
    //       sameSite: 'none',
    //       expires: new Date(0),
    //       path: '/',
    //     }),
    //   );
    // }
    // if (cookies.length > 0) {
    //   res.setHeader('Set-Cookie', cookies);
    // }
    res
      .status(StatusCodes.OK)
      .json(HttpResponse.Paginate({ code: 200, message: 'Logout success' }));
  }
}
