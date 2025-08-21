// src/utils/app-error.ts
import { StatusCodes } from 'http-status-codes';

import i18n from '../Ei18n'; // Thay '@/i18n' bằng '../i18n' hoặc giữ nếu dùng tsc-alias
import { IAppError, IError } from '../types/errors';

export class AppError implements IAppError {
  id: string;
  message: string;
  detail?: any;
  errors?: IError;
  params?: Record<string, any> | undefined;
  statusCode: StatusCodes;

  constructor({ id, message, detail, errors, params, statusCode }: IAppError) {
    this.id = id;
    this.message = message;
    this.statusCode = statusCode;
    this.detail = detail;
    this.errors = errors;
    this.params = params || {};
  }

  translate(locale: string) {
    const params = this.params || {};

    this.message = i18n.__({ phrase: this.message, locale }, params);
    if (this.errors) {
      const keys = Object.keys(this.errors);

      keys.forEach((key) => {
        if (this.errors && this.errors[key]) {
          this.errors[key] = this.errors[key].map((error) => {
            return {
              id: error.id,
              message: i18n.__({ phrase: error.id, locale }, params),
            };
          });
        }
      });
    }

    delete this.params;
  }
}
