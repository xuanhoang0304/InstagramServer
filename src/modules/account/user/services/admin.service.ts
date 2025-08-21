import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { AuthServices } from '~/modules/account/auth/services/auth.services';
import { AppError } from '~/utils/app-error';
import { BaseRepository } from '~/utils/baseRepository';
import handleHashPassword from '~/utils/handleHashPassword';

import { CreateAdminDTO, LoginAdminDTO } from '../dtos/admin.dto';
import { AdminModel } from '../model/admin.model';
import { AdminRepository } from '../repositories/admin.repository';

export class AdminService {
  static async login(data: LoginAdminDTO) {
    const Eadmin = await BaseRepository.getByField(AdminModel, 'email', data.email);

    if (!Eadmin) {
      throw new AppError({
        id: 'AdminService.login.notFound',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    const isMatchingPW = await bcrypt.compare(data.password, Eadmin.password);
    if (!isMatchingPW) {
      throw new AppError({
        id: 'AdminService.login.Account',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    const token = AuthServices.signADminJWT(Eadmin);

    const result = {
      accesstoken: token,
      user: AuthServices.withoutFieldsUser(Eadmin),
    };
    return result;
  }
  static async create(data: CreateAdminDTO) {
    const Eadmin = await BaseRepository.getByField(AdminModel, 'email', data.email);

    if (Eadmin) {
      throw new AppError({
        id: 'AdminService.create.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'EMAIL_IS_EXISTED',
        params: { email: data.email },
      });
    }
    const password = data.password ? data.password : 'admin';
    const hashPassword = await handleHashPassword(password);
    const user = await AdminRepository.create({ ...data, password: hashPassword });
    const result = AuthServices.withoutFieldsUser(user);
    return result;
  }
  static async getMe(userId: string) {
    const user = await BaseRepository.getByField(AdminModel, '_id', userId);
    if (!user) {
      throw new AppError({
        id: 'AdminService.getMe.err',
        message: 'USER_NOTFOUND',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const token = AuthServices.signADminJWT(user);
    return {
      user: AuthServices.withoutFieldsUser(user),
      token,
    };
  }
}
