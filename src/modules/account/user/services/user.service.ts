import diacritics from 'diacritics';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { wsServer } from '~/app';
import { AuthServices } from '~/modules/account/auth/services/auth.services';
import { OtpRepository } from '~/modules/account/otp/repositories/otp.repository';
import { CreateNotify } from '~/modules/notify/dtos/notify.dtos';
import { ENotifyType, ETargetType } from '~/modules/notify/model/notify.model';
import { NotifyService } from '~/modules/notify/services/notify.service';
import { PostModel } from '~/modules/post/model/post.model';
import { PostRepository } from '~/modules/post/repositories/post.repository';
import { AppError } from '~/utils/app-error';
import { BaseRepository } from '~/utils/baseRepository';
import handleHashPassword from '~/utils/handleHashPassword';
import { getSocketId } from '~/utils/helpers';

import {
  RegisterSocialUserDTO,
  RegisterUserDTO,
  UpdateUserDTO,
  UserFilters,
} from '../dtos/user.dto';
import { IUser, UserModel } from '../model/user.model';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
  static async getPaginate(filter: UserFilters) {
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
    const socketId = getSocketId(String(followId));
    if (socketId) {
      wsServer.sendToSocket(socketId, 'notify', {
        type: 'follow-user',
        data: {
          sender: user,
          message: `${user?.name} đã theo dõi bạn`,
        },
      });
    }
    const notifyData: CreateNotify = {
      sender: userId,
      recipient: followId,
      content: `${user?.name} đã theo dõi bạn`,
      type: ENotifyType.followUser,
      target: {
        type: ETargetType.User,
        target_id: new Types.ObjectId(userId),
      },
    };
    NotifyService.createNotify(notifyData);

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
    const socketId = getSocketId(String(post.createdBy));
    if (socketId && userId !== String(post.createdBy)) {
      wsServer.sendToSocket(socketId, 'notify', {
        type: 'save-post',
        data: {
          sender: user,
          post,
          message: `${user?.name} đã lưu bài post của bạn`,
        },
      });
    }
    const notifyData: CreateNotify = {
      sender: userId,
      recipient: String(post.createdBy),
      content: `${user?.name} đã lưu bài post của bạn`,
      type: ENotifyType.savePost,
      target: {
        type: ETargetType.Post,
        target_id: new Types.ObjectId(postId),
      },
    };
    NotifyService.createNotify(notifyData);

    return result;
  }
  static async likePost(userId: string, postId: string) {
    const [user, post] = await Promise.all([
      await BaseRepository.getByField(UserModel, '_id', userId),
      await BaseRepository.getByField(PostModel, '_id', postId),
    ]);
    if (!post) {
      throw new AppError({
        id: 'UserService.likePost.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bài post không tồn tại',
      });
    }

    const liked = post?.likes.map((id) => String(id));
    // check liked ?
    if (liked?.length && liked.includes(userId)) {
      const result = await PostRepository.unlikePost(userId, postId);
      return result;
    }
    const result = await PostRepository.likePost(userId, postId);
    const socketId = getSocketId(String(post.createdBy));
    if (socketId && userId !== String(post.createdBy)) {
      wsServer.sendToSocket(socketId, 'notify', {
        type: 'like-post',
        data: {
          sender: user,
          post,
          message: `${user?.name} đã thích bài post của bạn`,
        },
      });
    }
    const notifyData: CreateNotify = {
      sender: userId,
      recipient: String(post.createdBy),
      content: `${user?.name} đã thích bài post của bạn`,
      type: ENotifyType.likePost,
      target: {
        type: ETargetType.Post,
        target_id: new Types.ObjectId(postId),
      },
    };
    NotifyService.createNotify(notifyData);

    return result;
  }
  static async updateInfo(userId: string, data: UpdateUserDTO) {
    const existedUser = await this.getById(userId);
    if (!existedUser) {
      throw new AppError({
        id: 'UserService.updateInfo',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'USER_NOTFOUND',
      });
    }
    if (data.email) {
      const existedEmail = await UserRepository.findByUsernameOrEmail(data.email);
      if (existedEmail) {
        throw new AppError({
          id: 'UserService.updateInfo',
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'EMAIL_IS_EXISTED',
          params: { email: data.email },
        });
      }
    }
    const finalData = data.name
      ? { ...data, name_normailized: diacritics.remove(String(data.name)).toLowerCase() }
      : data;
    const newUser = await UserRepository.updateUserInfo(userId, finalData);
    const result = AuthServices.withoutFieldsUser(newUser as IUser);
    return result;
  }
}
