import { StatusCodes } from 'http-status-codes';
import { BaseFilters, BaseRepository } from '@/utils/baseRepository';
import { PostRepository } from '../repositories/post.repository';
import { PostModel } from '../model/post.model';
import { AppError } from '@/utils/app-error';
import { CreateCommentDTO, CreateReplyCommentDTO, UpdateCommentDTO } from '../dtos/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentModel } from '../model/coment.model';

export class CommentService {
  static async getReplies(parentCommentId: string, filters: BaseFilters) {
    const result = await CommentRepository.getRepliesByParentCommentId(parentCommentId, filters);
    return result;
  }
  static async create(data: CreateCommentDTO) {
    const post = await BaseRepository.getByField(PostModel, '_id', data.postId);
    if (!post) {
      throw new AppError({
        id: 'CommentService.create.err',
        message: 'Bài post không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const result = await CommentRepository.create(data);
    PostRepository.commentPost(data.postId, String(result?._id));
    return result;
  }
  static async update(commentId: string, data: UpdateCommentDTO, createdBy: string) {
    const oldCmt = await BaseRepository.getByField(CommentModel, '_id', commentId);
    if (!oldCmt || String(oldCmt.createdBy) !== createdBy) {
      throw new AppError({
        id: 'PostService.update.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Cmt không tồn tại hoặc không phải của bạn',
      });
    }
    const result = await CommentRepository.update(commentId, { ...oldCmt, content: data.content });
    return result;
  }
  static async delete(commentId: string, createdBy: string) {
    const oldCmt = await BaseRepository.getByField(CommentModel, '_id', commentId);
    if (!oldCmt || String(oldCmt.createdBy) !== createdBy) {
      throw new AppError({
        id: 'PostService.delete.err',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Cmt không tồn tại hoặc không phải của bạn',
      });
    }
    if (oldCmt.parentCommentId) {
      CommentRepository.removeCmtToReplies(String(oldCmt.parentCommentId), commentId);
    }
    if (oldCmt.replies.length) {
      const replies = oldCmt.replies.map((id) => String(id));
      PostRepository.removeRepliescommentPost(String(oldCmt.post), replies);
    }
    const result = await CommentRepository.delete(commentId, String(oldCmt.post));
    CommentRepository.deleteCmtByParentId(commentId);
    return result;
  }
  static async createReply(data: CreateReplyCommentDTO) {
    const [post, parentCmt] = await Promise.all([
      BaseRepository.getByField(PostModel, '_id', data.postId),
      BaseRepository.getByField(CommentModel, '_id', data.commentId),
    ]);
    if (!post) {
      throw new AppError({
        id: 'CommentService.createReply.err',
        message: 'Bài post không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const postComment = post.comments.map((id) => String(id));
    if (!parentCmt || !postComment.includes(data.commentId)) {
      throw new AppError({
        id: 'CommentService.createReply.err',
        message: 'Comment không tồn tại hoặc không phải trong bài post này',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const result = await CommentRepository.createReply({
      ...data,
      parentCommentId: String(parentCmt._id),
    });
    PostRepository.commentPost(data.postId, String(result?._id));
    CommentRepository.addCmtToReplies(String(parentCmt._id), String(result?._id));
    return result;
  }
}
