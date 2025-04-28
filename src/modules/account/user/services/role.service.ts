import { StatusCodes } from 'http-status-codes';
import { BaseRepository } from '@/utils/baseRepository';
import { EPermissions } from '../model/permission.model';
import { AdminModel } from '../model/admin.model';
import { AppError } from '@/utils/app-error';
import { RoleModel } from '../model/role.model';

export class RoleService {
  static async checkPerrmission(userId: string, permission: EPermissions) {
    const user = await BaseRepository.getByField(AdminModel, '_id', userId);
    if (!user || !user.role) {
      throw new AppError({
        id: 'checkPerrmission.middleware.err',
        statusCode: StatusCodes.FORBIDDEN,
        message: 'FORBIDDEN',
      });
    }

    const role = await BaseRepository.getByField(RoleModel, '_id', user.role);
    if (!role || !role.permissions.includes(permission)) {
      throw new AppError({
        id: 'checkPerrmission.middleware.err',
        statusCode: StatusCodes.FORBIDDEN,
        message: 'FORBIDDEN',
      });
    }
    return user;
  }
}
