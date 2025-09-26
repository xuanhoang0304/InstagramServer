// eslint-disable-next-line import/no-extraneous-dependencies
import diacritics from 'diacritics';
import { Types } from 'mongoose';
import { PostModel } from '~/modules/post/model/post.model';

import { BaseRepository } from '../../../../utils/baseRepository';
import { RegisterDTO } from '../../auth/dtos/auth.dtos';
import { UpdateUserDTO, UserFilters } from '../dtos/user.dto';
import { UserModel } from '../model/user.model';

export class UserRepository {
  static getQuery(filters: UserFilters) {
    const condition: Record<string, any> = {};
    if (filters.keyword) {
      const normalizedKeyword = diacritics.remove(filters.keyword).toLowerCase();
      condition.name_normailized = { $regex: new RegExp(normalizedKeyword, 'i') };
    }
    if (filters.email) {
      condition.email = { $regex: new RegExp(filters.email, 'i') };
    }
    if (filters.follow && filters.follow.length) {
      condition._id = { $nin: filters.follow.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.excludes && filters.excludes.length && filters.follow && filters.follow.length) {
      const excludes = filters.excludes;
      const follow = filters.follow;
      const filtersArr = [...excludes, ...follow].map((id) => new Types.ObjectId(id));
      condition._id = { $nin: filtersArr };
    }
    if (filters.excludes && filters.excludes.length) {
      condition._id = { $nin: filters.excludes.map((id) => new Types.ObjectId(id)) };
    }
    return { condition };
  }
  static async getExploreUsers(filters: UserFilters) {
    const { paginate } = await BaseRepository.getQuery(filters);
    const { condition } = this.getQuery(filters);

    const [result, totalResult] = await Promise.all([
      UserModel.aggregate([
        { $match: condition },
        {
          $project: {
            username: 0,
            password: 0,
          },
        },
        { $sample: { size: paginate.limit } },
      ]),
      UserModel.find(condition).countDocuments(),
    ]);

    return {
      result,
      totalResult,
    };
  }
  static async findByUsernameOrEmail(username: string) {
    const Conditions = {
      $or: [{ email: username }, { username }],
    };
    return UserModel.findOne(Conditions).lean();
  }
  static async create(data: RegisterDTO) {
    const user = (
      await UserModel.create({
        ...data,
        name_normailized: diacritics.remove(data.name).toLowerCase(),
      })
    ).toObject();
    const { password, username, ...result } = user;
    return result;
  }
  static async getById(id: string) {
    return UserModel.findById(id).select({ password: 0 }).lean();
  }
  static async getFilters(filters: UserFilters) {
    const { condition } = UserRepository.getQuery(filters);
    const { sort, paginate } = BaseRepository.getQuery(filters);
    const [users, totalUser] = await Promise.all([
      UserModel.find(condition)
        .sort(sort)
        .skip(paginate.skip)
        .limit(paginate.limit)
        .select({ password: 0 }),
      UserModel.find(condition).countDocuments(),
    ]);
    return { users, totalUser };
  }
  static async followUser(userId: string, followId: string) {
    const [user] = await Promise.all([
      UserModel.findByIdAndUpdate(
        userId,
        {
          $push: { followings: followId },
        },
        { new: true },
      ),
      UserModel.findByIdAndUpdate(
        followId,
        {
          $push: { followers: userId },
        },
        { new: true },
      ),
    ]);
    return user?.toObject();
  }
  static async unfollowUser(userId: string, followId: string) {
    const [user] = await Promise.all([
      UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { followings: followId },
        },
        { new: true },
      ),
      UserModel.findByIdAndUpdate(
        followId,
        {
          $pull: { followers: userId },
        },
        { new: true },
      ),
    ]);
    return user?.toObject();
  }
  static async unsavePost(userId: string, postId: string) {
    const [, post] = await Promise.all([
      UserModel.findByIdAndUpdate(userId, {
        $pull: {
          saved: postId,
        },
      }),
      PostModel.findByIdAndUpdate(
        postId,
        {
          $pull: {
            savedBy: userId,
          },
        },
        {
          new: true,
        },
      ).populate('createdBy', 'name avatar isReal'),
    ]);
    return post;
  }
  static async savePost(userId: string, postId: string) {
    const [, post] = await Promise.all([
      UserModel.findByIdAndUpdate(userId, {
        $push: {
          saved: postId,
        },
      }),
      PostModel.findByIdAndUpdate(
        postId,
        {
          $push: {
            savedBy: userId,
          },
        },
        {
          new: true,
        },
      ).populate('createdBy', 'name avatar isReal'),
    ]);
    return post;
  }
  static async updateUserInfo(userId: string, data: UpdateUserDTO) {
    const newUser = await UserModel.findByIdAndUpdate(userId, data, { new: true }).lean();

    return newUser;
  }
}
