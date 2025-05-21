import { StatusCodes } from 'http-status-codes';

import { AuthServices } from '@/modules/account/auth/services/auth.services';
import { OtpRepository } from '@/modules/account/otp/repositories/otp.repository';
import { PostModel } from '@/modules/post/model/post.model';
import { PostRepository } from '@/modules/post/repositories/post.repository';
import { AppError } from '@/utils/app-error';
import { BaseRepository } from '@/utils/baseRepository';
import handleHashPassword from '@/utils/handleHashPassword';

import { RegisterSocialUserDTO, RegisterUserDTO, UserFilters } from '../dtos/user.dto';
import { IUser, UserModel } from '../model/user.model';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
  static async getPaginate(filter: UserFilters) {
    console.log(filter);
    const result = await UserRepository.getFilters(filter);
    return result;
  }
  static async getExploreUsers(userId: string, filters: UserFilters) {
    const user = await this.getById(userId);
    if (!user) {
      throw new AppError({
        id: 'UserService.getExploreUsers',
        message: 'USER_NOTFOUND',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const following = user.followings.map((id) => String(id));
    const result = await UserRepository.getExploreUsers({
      ...filters,
      follow: [...following, userId],
      excludes: filters.excludes,
    });
    return result;
  }
  static async Register(data: RegisterUserDTO) {
    const [existedgUser, existedgUserName] = await Promise.all([
      UserRepository.findByUsernameOrEmail(data.email),
      UserRepository.findByUsernameOrEmail(data.username),
    ]);
    if (existedgUser) {
      throw new AppError({
        id: 'UserService.register.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'EMAIL_IS_EXISTED',
        params: { email: data.email },
      });
    }
    if (existedgUserName) {
      throw new AppError({
        id: 'UserService.register.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Username đã được dùng !',
      });
    }
    const hashPassword = await handleHashPassword(data.password);
    const newUser = { ...data, password: hashPassword };
    await OtpRepository.deleteOtp(data.email);
    return UserRepository.create(newUser);
  }
  static async RegisterSocial(data: RegisterSocialUserDTO) {
    const existedgUser = await BaseRepository.getByField(UserModel, 'email', data.email);
    if (existedgUser) {
      return existedgUser;
    }
    const newUser = {
      ...data,
      username: data.email,
      password: '',
      avatar: data.avatar ? data.avatar : '',
    };
    return UserRepository.create(newUser);
  }
  static async getById(id: string) {
    return UserRepository.getById(id);
  }
  static async followUser(userId: string, followId: string) {
    if (userId === followId) {
      throw new AppError({
        id: 'UserService.followUser',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bạn không thể follow chính mình!',
      });
    }
    const [user, fluser] = await Promise.all([this.getById(userId), this.getById(followId)]);
    if (!user || !fluser) {
      throw new AppError({
        id: 'UserService.followUser.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    const userFollowing = user.followings.map((id) => String(id));
    // check followed ?
    if (userFollowing.includes(String(fluser._id))) {
      const result = await UserRepository.unfollowUser(userId, followId);
      return AuthServices.withoutFieldsUser(result as IUser);
    }
    const result = await UserRepository.followUser(userId, followId);
    return AuthServices.withoutFieldsUser(result as IUser);
  }
  static async savePost(userId: string, postId: string) {
    const [user, post] = await Promise.all([
      await BaseRepository.getByField(UserModel, '_id', userId),
      await BaseRepository.getByField(PostModel, '_id', postId),
    ]);
    if (!post) {
      throw new AppError({
        id: 'UserService.savePost.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bài post không tồn tại',
      });
    }
    const saved = user?.saved.map((id) => String(id));
    // check saved ?
    if (saved?.length && saved.includes(postId)) {
      const result = await UserRepository.unsavePost(userId, postId);
      return result;
    }
    const result = await UserRepository.savePost(userId, postId);
    return result;
  }
  static async likePost(userId: string, postId: string) {
    const post = await BaseRepository.getByField(PostModel, '_id', postId);
    if (!post) {
      throw new AppError({
        id: 'UserService.savePost.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bài post không tồn tại',
      });
    }

    const liked = post?.likes.map((id) => String(id));
    // check saved ?
    if (liked?.length && liked.includes(userId)) {
      const result = await PostRepository.unlikePost(userId, postId);
      return result;
    }
    const result = await PostRepository.likePost(userId, postId);
    return result;
  }
}
