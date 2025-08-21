import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AnySchema } from 'yup';
import { AppError } from '~/utils/app-error';
import { formatErrorYup } from '~/utils/helpers';

export const validate = (schema: AnySchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.validate(req.body, {
        abortEarly: false,
        // stripUnknown: true,
      });

      next();
    } catch (errorYup) {
      const errors = formatErrorYup(errorYup);
      next(
        new AppError({
          id: 'validate.middleware',
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Validation error',
          errors,
        }),
      );
    }
  };
};
