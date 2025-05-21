import { Request, Response } from 'express';
import * as cookie from 'cookie';
import { StatusCodes } from 'http-status-codes';
import { HttpResponse } from '../../../../utils/httpResponse';
import { LoginDTO } from '../dtos/auth.dtos';
import { AuthServices } from '../services/auth.services';
import { IUser } from '../../user/model/user.model';

export class AuthControllers {
  async getMe(req: Request, res: Response) {
    const user = req.user as IUser;
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(user));
  }
  async Login(req: Request, res: Response) {
    const data: LoginDTO = req.body;
    const result = await AuthServices.Login(data);
    const cookies: string[] = [];

    if (result.refreshToken) {
      cookies.push(
        cookie.serialize('refreshToken', String(result.refreshToken), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 ngày
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
    res.status(200).json({
      code: 200,
      message: 'Token refreshed successfully',
      data: result,
    });
  }
}
