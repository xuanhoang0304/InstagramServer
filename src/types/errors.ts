import { StatusCodes } from 'http-status-codes';

export type IFieldError = {
  id: string;
  message: string;
};
export type IError = Record<string, IFieldError[]>;

export interface IAppError {
  id: string;
  message: string;
  statusCode: StatusCodes;
  detail?: any;
  errors?: IError;
  params?: Record<string, any>;
}
