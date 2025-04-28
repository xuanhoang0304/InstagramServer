import { Types } from 'mongoose';
import { BaseRepository } from '@/utils/baseRepository';
import { CreatePostDTO, PostFilters, UpdatePostDTO } from '../dtos/post.dto';
import { PostModel } from '../model/post.model';

export class PostRepository {
  static getQueries(filter: PostFilters) {
    const conditions: Record<string, any> = {};
    if (filter?.createdBy?.length) {
      conditions.createdBy = {
        $in: filter.createdBy.map((item: string) => new Types.ObjectId(item)),
      };
    }
    if (filter?.NotcreatedBy?.length) {
      conditions.createdBy = {
        $nin: filter.NotcreatedBy.map((item: string) => new Types.ObjectId(item)),
      };
    }
    if (filter?.excludes?.length) {
      conditions._id = { $nin: filter.excludes.map((item: string) => new Types.ObjectId(item)) };
    }

    return conditions;
  }
  static async getPagination(filters: PostFilters) {
    const condition = PostRepository.getQueries(filters);
    const { sort, paginate } = await BaseRepository.getQuery(filters);
    const [result, total] = await Promise.all([
      PostModel.find(condition)
        .sort(sort)
        .limit(paginate.limit)
        .skip(paginate.skip)
        .populate('createdBy', '_id name avatar website bio followers followings saved isReal'),
      PostModel.find(condition).countDocuments(),
    ]);

    return { result, total };
  }
  static async getDiscoverPosts(filters: PostFilters) {
    const condition = await PostRepository.getQueries(filters);
    const [result, total] = await Promise.all([
      PostModel.aggregate([
        { $match: condition },
        { $sample: { size: Number(filters.limit) } },
        {
          $lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'createdBy',
            as: 'userInfo',
          },
        },
        {
          $unwind: '$userInfo',
        },
        {
          $project: {
            _id: 1,
            media: 1,
            caption: 1,
            likes: 1,
            comments: 1,
            savedBy: 1,
            isReel: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
            createdBy: {
              _id: '$userInfo._id',
              name: '$userInfo.name',
              avatar: '$userInfo.avatar',
              website: '$userInfo.website',
              bio: '$userInfo.bio',
              followers: '$userInfo.followers',
              followings: '$userInfo.followings',
              saved: '$userInfo.saved',
              isReal: '$userInfo.isReal',
            },
          },
        },
        {
          $unset: 'userInfo',
        },
        { $sort: { borough: -1 } },
      ]),
      PostModel.find(condition).countDocuments(),
    ]);

    return { result, total };
  }
  static async getById(id: string) {
    const result = await PostModel.findById(id)
      .populate('createdBy', '_id name avatar website bio followers followings saved isReal')
      .lean();
    return result;
  }
  static async create(data: CreatePostDTO) {
    const result = (await PostModel.create({ ...data, createdBy: data.curUserId })).toObject();
    return result;
  }
  static async update(postId: string, data: UpdatePostDTO) {
    const result = await PostModel.findByIdAndUpdate(postId, data, { new: true });
    return result;
  }
  static async delete(postId: string) {
    const result = await PostModel.findByIdAndDelete(postId, { new: true });
    return result;
  }
  static async commentPost(postId: string, commentId: string) {
    await PostModel.findByIdAndUpdate(postId, {
      $push: {
        comments: commentId,
      },
    });
  }
  static async removeRepliescommentPost(postId: string, comments: string[]) {
    await PostModel.findByIdAndUpdate(postId, {
      $pull: {
        comments: { $in: comments },
      },
    });
  }
  static async likePost(userId: string, postId: string) {
    const result = await PostModel.findByIdAndUpdate(
      postId,
      {
        $push: {
          likes: userId,
        },
      },
      { new: true },
    ).populate('createdBy', 'name avatar isReal');
    return result;
  }
  static async unlikePost(userId: string, postId: string) {
    const result = await PostModel.findByIdAndUpdate(
      postId,
      {
        $pull: {
          likes: userId,
        },
      },
      { new: true },
    ).populate('createdBy', 'name avatar isReal');
    return result;
  }
}
