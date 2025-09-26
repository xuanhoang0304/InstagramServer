import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { wsServer } from '~/app';
import { CreateNotify } from '~/modules/notify/dtos/notify.dtos';
import { ENotifyType, ETargetType } from '~/modules/notify/model/notify.model';
import { NotifyRepository } from '~/modules/notify/repositories/notify.repository';
import { NotifyService } from '~/modules/notify/services/notify.service';
import { AppError } from '~/utils/app-error';
import { BaseFilters, BaseRepository } from '~/utils/baseRepository';
import { getSocketId } from '~/utils/helpers';

import { CreateCommentDTO, CreateReplyCommentDTO, UpdateCommentDTO } from '../dtos/comment.dto';
import { CommentModel } from '../model/coment.model';
import { PostModel } from '../model/post.model';
import { CommentRepository } from '../repositories/comment.repository';
import { PostRepository } from '../repositories/post.repository';
import { PostService } from './post.service';

export class CommentService {
  static async getReplies(parentCommentId: string, filters: BaseFilters) {
    const result = await CommentRepository.getRepliesByParentCommentId(parentCommentId, filters);
    return result;
  }
  static async getCmtById(cmtId: string) {
    const result = await CommentRepository.getCmtById(cmtId);
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
    if (String(result.createdBy._id) !== String(post.createdBy)) {
      const socketId = getSocketId(String(post.createdBy));
      if (socketId && data.createdBy !== String(post.createdBy)) {
        wsServer.sendToSocket(socketId, 'notify', {
          type: 'comment-post',
          data: {
            sender: result.createdBy,
            message: `${result.createdBy.name} đã bình luận bài post của bạn : ${result.content}`,
            post,
          },
        });
      }
      const notifyData: CreateNotify = {
        sender: data.createdBy,
        recipient: String(post.createdBy),
        content: `${result.createdBy.name} đã bình luận bài post của bạn : ${result.content}`,
        type: ENotifyType.commentPost,
        target: {
          type: ETargetType.Comment,
          target_id: new Types.ObjectId(result._id as string),
        },
      };
      NotifyService.createNotify(notifyData);
    }

    return result;
  }
  static async createReply(data: CreateReplyCommentDTO) {
    const [post, parentCmt, replyComment] = await Promise.all([
      PostService.getPostByPostId(data.postId),
      BaseRepository.getByField(CommentModel, '_id', data.parentCommentId),
      BaseRepository.getByField(CommentModel, '_id', data.replyCommentId),
    ]);
    if (!post) {
      throw new AppError({
        id: 'CommentService.createReply.err',
        message: 'Bài post không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const postComment = post.comments.map((id) => String(id));
    if (!parentCmt || !replyComment || !postComment.includes(data.parentCommentId)) {
      throw new AppError({
        id: 'CommentService.createReply.err',
        message: 'Comment không tồn tại hoặc không phải trong bài post này',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const result = await CommentRepository.createReply({
      ...data,
      parentCommentId: String(parentCmt._id),
      replyCommentId: data.replyCommentId,
    });
    PostRepository.commentPost(data.postId, String(result?._id));
    CommentRepository.addCmtToReplies(String(data.replyCommentId), String(result?._id));
    if (data.parentCommentId !== data.replyCommentId) {
      CommentRepository.addCmtToReplies(String(data.parentCommentId), String(result?._id));
    }

    if (String(result.createdBy._id) !== String(replyComment.createdBy)) {
      const socketId = getSocketId(String(replyComment.createdBy));
      if (socketId) {
        wsServer.sendToSocket(socketId, 'notify', {
          type: 'comment-post',
          data: {
            sender: result.createdBy,
            message: `${result.createdBy.name} đã trả lời bình luận của bạn : ${result.content}`,
            post,
          },
        });
      }
      const notifyData: CreateNotify = {
        sender: data.createdBy,
        recipient: String(replyComment.createdBy),
        content: `${result.createdBy.name} đã trả lời bình luận của bạn : ${result.content}`,
        type: ENotifyType.replyComment,
        target: {
          type: ETargetType.Comment,
          target_id: new Types.ObjectId(result._id as string),
        },
      };
      NotifyService.createNotify(notifyData);
    }

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
      const promisesNotify = replies.map((id) => NotifyService.deleteNotify(id));
      CommentRepository.removeCmtToReplies(String(oldCmt.parentCommentId), commentId);
      const promiesesPullReply = replies.map((id) =>
        CommentRepository.removeCmtToReplies(String(oldCmt.parentCommentId), id),
      );
      const promieseDeleteReply = replies.map((id) =>
        CommentRepository.delete(id, String(oldCmt.post)),
      );
      Promise.all([...promisesNotify, ...promiesesPullReply, ...promieseDeleteReply]);
    }
    if (String(oldCmt.parentCommentId) !== String(oldCmt.replyCommentId)) {
      CommentRepository.removeCmtToReplies(String(oldCmt.replyCommentId), commentId);
    }
    const result = await CommentRepository.delete(commentId, String(oldCmt.post));
    CommentRepository.deleteCmtByParentId(commentId);
    NotifyRepository.deleteNotifyByTargetId(commentId, ETargetType.Comment);
    return result;
  }
}
