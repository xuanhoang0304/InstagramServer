import { Types } from 'mongoose';
import { PostModel } from '@/modules/post/model/post.model';
import { BaseRepository } from '../../../../utils/baseRepository';
import { RegisterDTO } from '../../auth/dtos/auth.dtos';
import { UserFilters } from '../dtos/user.dto';
import { UserModel } from '../model/user.model';

export class UserRepository {
  static getQuery(filters: UserFilters) {
    const condition: Record<string, any> = {};
    if (filters.keyword) {
      condition.name = { $regex: new RegExp(filters.keyword, 'i') };
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
    return { condition };
  }
  static async getExploreUsers(filters: UserFilters) {
    const { paginate } = await BaseRepository.getQuery(filters);
    const { condition } = this.getQuery(filters);
    const [result, totalResult] = await Promise.all([
      UserModel.aggregate([{ $match: condition }, { $sample: { size: paginate.limit } }]),
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
    const user = (await UserModel.create(data)).toObject();
    const { password, ...result } = user;
    return result;
  }
  static async getById(id: string) {
    return UserModel.findById(id).select({ password: 0 }).lean();
  }
  static async getFilters(filters: UserFilters) {
    const { condition } = UserRepository.getQuery(filters);
    const { sort, paginate } = BaseRepository.getQuery(filters);
    const result = await UserModel.find(condition)
      .sort(sort)
      .skip(paginate.skip)
      .limit(paginate.limit)
      .select({ password: 0 });
    return result;
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
}
