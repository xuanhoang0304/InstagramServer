import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

import ConfignEnv from '@/config/env';
import { EPermissions } from '@/modules/account/user/model/permission.model';
import { RoleService } from '@/modules/account/user/services/role.service';
import { AppError } from '@/utils/app-error';

export const authAdminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError({
        id: 'authAdmin.middleware.token',
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'UNAUTHORIZE',
      });
    }
    const decoded = jwt.verify(token, ConfignEnv.JWT_ADMIN_SECRET) as JwtPayload & { id: string };
    if (!decoded?.id) {
      throw new AppError({
        id: 'authAdmin.middleware.decoded',
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'UNAUTHORIZE',
      });
    }
    req.headers.userId = decoded.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(
      new AppError({
        id: 'authAdmin.middleware.err',
        message: 'UNAUTHORIZE',
        statusCode: StatusCodes.UNAUTHORIZED,
      }),
    );
  }
};
export const checkPerrmissionMiddleware =
  (permission: EPermissions) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.headers.userId as string;
      if (!userId) {
        throw new AppError({
          id: 'checkPerrmission.middleware.err',
          statusCode: StatusCodes.FORBIDDEN,
          message: 'FORBIDDEN',
        });
      }
      await RoleService.checkPerrmission(userId, permission);
      req.headers.userId = userId;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      next(
        new AppError({
          id: 'checkPerrmission.middleware.err',
          message: 'FORBIDDEN',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    }
  };
