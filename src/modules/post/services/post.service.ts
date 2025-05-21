import { StatusCodes } from 'http-status-codes';

import { UserModel } from '@/modules/account/user/model/user.model';
import { UploadService } from '@/modules/upload/services/upload.service';
import { AppError } from '@/utils/app-error';
import { BaseFilters, BaseRepository } from '@/utils/baseRepository';

import { CreatePostDTO, PostFilters, UpdatePostDTO } from '../dtos/post.dto';
import { CommentModel } from '../model/coment.model';
import { IPost, PostModel } from '../model/post.model';
import { CommentRepository } from '../repositories/comment.repository';
import { PostRepository } from '../repositories/post.repository';

export class PostService {
  static getPagination = async (filters: PostFilters) => {
    const result = await PostRepository.getPagination(filters);
    return result;
  };
  static async getPostByPostId(postId: string) {
    const result = await PostRepository.getById(postId);
    return result;
  }
  static async getDiscoverPosts(id: string, filters: PostFilters) {
    const excludes = filters.excludes || []; // Mảng PostId được gọi trước đó
    const user = await BaseRepository.getById(UserModel, id);
    if (!user) {
      throw new AppError({
        id: 'PostService.getPostsByFollowing',
        message: 'USER_NOTFOUND',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const following = [...user.followings.map((item) => String(item)), id];
    const result = await PostRepository.getDiscoverPosts({
      ...filters,
      excludes,
      NotcreatedBy: following,
    });
    return result;
  }
  static async getPostsByFollowing(id: string, filters: PostFilters) {
    const user = await BaseRepository.getById(UserModel, id);
    if (!user) {
      throw new AppError({
        id: 'PostService.getPostsByFollowing',
        message: 'USER_NOTFOUND',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const following = user.followings.map((item) => String(item));
    if (!following.length) {
      return {
        result: [],
      };
    }
    const result = await this.getPagination({ ...filters, createdBy: following });
    return result;
  }
  static async getCommentsByPostId(postId: string, PostCommentsFilter: BaseFilters) {
    const post = await BaseRepository.getByField(PostModel, '_id', postId);
    if (!post) {
      throw new AppError({
        id: 'PostService.getCommentsByPostId',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Bài post không tồn tại',
      });
    }
    const result = await CommentRepository.getCommentsByPostId(postId, PostCommentsFilter);
    return result;
  }
  static async create(data: CreatePostDTO) {
    const post = await PostRepository.create(data);
    return post;
  }
  static async update(postId: string, data: UpdatePostDTO) {
    const oldPost = (await BaseRepository.getByField(PostModel, '_id', postId)) as IPost;
    if (!oldPost) {
      throw new AppError({
        id: 'PostService.update.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bài post không tồn tại',
      });
    }
    if (String(oldPost.createdBy) !== data.curUserId) {
      throw new AppError({
        id: 'PostService.update.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bạn không phải là người tạo bài post này',
      });
    }
    const result = await PostRepository.update(postId, data);
    return result;
  }
  static async delete(postId: string, curUserId: string) {
    //  Cách xóa 1 bài post
    //   tìm bài post theo id?
    const oldPost = (await BaseRepository.getByField(PostModel, '_id', postId)) as IPost;
    if (!oldPost) {
      throw new AppError({
        id: 'PostService.update.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bài post không tồn tại',
      });
    }
    //  check bài post đó phải do curUser tạo ra hay không?
    if (String(oldPost.createdBy) !== curUserId) {
      throw new AppError({
        id: 'PostService.update.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Bạn không phải là người tạo bài post này',
      });
    }

    //  xóa postId saved của User
    UserModel.updateMany(
      { _id: { $in: oldPost.savedBy } },
      {
        $pull: {
          saved: oldPost._id,
        },
      },
    );
    // xóa tất cả record comment của postId đó
    CommentModel.deleteMany({ post: oldPost._id });
    //  xóa media của bài post trên Cloudinary
    Promise.all(oldPost.media.map((item) => UploadService.deleteFileByPath(item.path, item.type)));
    //  xóa bài post
    const result = await PostRepository.delete(postId);
    return result;
  }
}
