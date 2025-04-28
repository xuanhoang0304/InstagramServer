import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import ConfignEnv from '../../../../config/env';
import { IUser, UserModel } from '../../user/model/user.model';
import { LoginDTO } from '../dtos/auth.dtos';
import { OtpRepository } from '../../otp/repositories/otp.repository';
import SendMail from '../../../../config/nodemailer';
import { AppError } from '@/utils/app-error';
import { IAdmin } from '../../user/model/admin.model';
import { ETypeOTP } from '../../otp/models/otp.model';
import { UserRepository } from '../../user/repositories/user.repository';
import { BaseRepository } from '@/utils/baseRepository';
import { generateOTP } from '@/utils/helpers';
import { StringValue } from '@/types/types';
import { UserService } from '@/modules/account/user/services/user.service';

export class AuthServices {
  static signJWT(data: Partial<IUser>, expiresIn: StringValue | number) {
    return jwt.sign({ id: data._id }, ConfignEnv.jwt_secret, {
      expiresIn,
    });
  }
  static signADminJWT(data: Partial<IAdmin>) {
    return jwt.sign({ id: data._id }, ConfignEnv.jwt_admin_secret, {
      expiresIn: '1d',
    });
  }

  static withoutFieldsUser(user: IUser | IAdmin) {
    const { password, ...withoutFieldsUser } = user;
    return withoutFieldsUser;
  }
  static isOtpValid(expires: Date | undefined) {
    if (!expires) return false;

    const currentDate = new Date();

    if (currentDate > expires) {
      return false;
    }

    return true;
  }

  static async sendOtp(email: string, typeOTP: ETypeOTP) {
    const existedUserEmail = await BaseRepository.getByField(UserModel, 'email', email);
    if (existedUserEmail) {
      throw new AppError({
        id: 'AuthService.sendOTP.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'EMAIL_IS_EXISTED',
        params: { email },
      });
    }
    // const otp = otpGenerator.generate(6, {
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    // });
    const otp = generateOTP(6);

    let htmlTemplate = `<h1>Xác thực OTP</h1><p>Mã OTP của bạn là: <b>{{otp}}</b></p>`;
    const emailContent = htmlTemplate.replace(/{{otp}}/g, otp);
    const otpExpires = new Date(Date.now() + 10 * 60000);

    const registerMail = {
      to: email,
      subject: 'OTP xác thực đăng ký',
      html: emailContent,
    };
    if (typeOTP === 'REGISTER') {
      const existedOtp = await OtpRepository.getOtpByEmail(email);
      const otpIvalid = this.isOtpValid(existedOtp?.expires);
      if (existedOtp && otpIvalid) {
        throw new AppError({
          id: 'AuthService.sendOTP.err',
          message: 'OTP had sent in your gmail !',
          statusCode: StatusCodes.BAD_REQUEST,
          errors: { otp: [{ id: 'OPT err', message: 'OTP had sent in your gmail !' }] },
        });
      }
      await OtpRepository.deleteOtp(email);
      await Promise.all([
        SendMail(registerMail),
        OtpRepository.createOtp({ email, otp, expires: otpExpires, typeOTP }),
      ]);
    } else {
      htmlTemplate = '';
      console.log('Forget');
    }
  }
  static async verifyOtp(otp: string, email: string) {
    const existedOtp = await OtpRepository.getOtpByEmail(email);
    if (!existedOtp || existedOtp.otp !== otp || !this.isOtpValid(existedOtp.expires)) {
      throw new AppError({
        id: 'AuthService.verifyOTP.err',
        message: 'OTP_INVAVLID',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    return existedOtp;
  }

  static async Login(data: LoginDTO) {
    const existedgUser = await UserRepository.findByUsernameOrEmail(data.username);
    if (!existedgUser) {
      throw new AppError({
        id: 'AuthService.login.notFound',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    const isMatchingPW = await bcrypt.compare(data.password, existedgUser.password);
    if (!isMatchingPW) {
      throw new AppError({
        id: 'AuthService.login.Account',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    const accessToken = this.signJWT(existedgUser, '15m');
    const refreshToken = this.signJWT(existedgUser, '7d');
    const result = {
      accessToken,
      refreshToken,
      user: this.withoutFieldsUser(existedgUser),
    };

    return result;
  }
  static async RefreshToken(refreshToken: string) {
    const now = Math.floor(Date.now() / 1000);
    const decodedRefreshToken = jwt.verify(refreshToken, ConfignEnv.jwt_secret) as JwtPayload & {
      id: string;
    };
    const existedgUser = await UserService.getById(decodedRefreshToken.id);
    if (!existedgUser) {
      throw new AppError({
        id: 'AuthService.RefreshToken',
        message: 'USER_NOTFOUND',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (decodedRefreshToken.exp && decodedRefreshToken?.exp < now) {
      throw new AppError({
        id: 'AuthService.RefreshToken',
        message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const accessToken = this.signJWT(existedgUser, '15m');
    return accessToken;
  }
}
