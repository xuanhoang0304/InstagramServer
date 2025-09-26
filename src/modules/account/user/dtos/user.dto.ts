import { BaseFilters } from '../../../../utils/baseRepository';
import { EAuthProvider, EUserGender } from '../model/user.model';

export interface RegisterUserDTO {
  name: string;
  username: string;
  email: string;
  password: string;
}
export interface RegisterSocialUserDTO {
  name: string;
  email: string;
  provider: EAuthProvider;
  avatar?: string;
}
export interface UpdateUserDTO {
  name?: string;
  bio?: string;
  gender?: EUserGender;
  email?: string;
  password?: string;
  isReal?: boolean;
  avatar?: string;
}

export interface UserFilters extends BaseFilters {
  keyword?: string;
  name?: string;
  email?: string;
  excludes?: string[];
  follow?: string[];
}
