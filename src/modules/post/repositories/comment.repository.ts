import { BaseFilters, BaseRepository } from '@/utils/baseRepository';
import { CreateCommentDTO, CreateReplyCommentDTO } from '../dtos/comment.dto';
import { CommentModel, IComment } from '../model/coment.model';
import { PostModel } from '../model/post.model';

export class CommentRepository {
  static async getCommentsByPostId(postId: string, PostCommentsFilter: BaseFilters) {
    const { sort, paginate } = await BaseRepository.getQuery(PostCommentsFilter);
    const [comments, totalComments] = await Promise.all([
      CommentModel.find({ post: postId, parentCommentId: null })
        .sort(sort)
        .limit(paginate.limit)
        .skip(paginate.skip)
        .populate('createdBy', '_id name avatar website bio followers followings saved isReal'),
      CommentModel.find({ post: postId, parentCommentId: null }).countDocuments(),
    ]);

    return { comments, totalComments };
  }
  static async getRepliesByParentCommentId(parentId: string, filters: BaseFilters) {
    const { sort, paginate } = BaseRepository.getQuery(filters);
    const [result, total] = await Promise.all([
      CommentModel.find({ parentCommentId: parentId })
        .sort(sort)
        .skip(paginate.skip)
        .limit(paginate.limit),
      CommentModel.findById(parentId),
    ]);
    const totalReplies = total?.replies.length;
    return {
      replies: result,
      totalReplies,
    };
  }
  static async create(data: CreateCommentDTO) {
    const result = await CommentModel.create({ ...data, post: data.postId, parentCommentId: null });
    return result.toObject();
  }
  static async createReply(data: CreateReplyCommentDTO) {
    const result = await CommentModel.create({
      ...data,
      post: data.postId,
      parentCommentId: data.parentCommentId,
    });

    return result.toObject();
  }
  static async update(commentId: string, data: IComment) {
    const result = await CommentModel.findByIdAndUpdate(
      commentId,
      { ...data, parentCommentId: data.parentCommentId },
      { new: true },
    );
    return result;
  }
  static async delete(commentId: string, postId: string) {
    const [result] = await Promise.all([
      CommentModel.findByIdAndDelete(commentId, { new: true }),
      PostModel.findByIdAndUpdate(postId, {
        $pull: { comments: commentId },
      }),
    ]);
    return result;
  }
  static async deleteCmtByParentId(ParentcmtId: string) {
    await CommentModel.deleteMany({ parentCommentId: ParentcmtId });
  }
  static async addCmtToReplies(parentCommentId: string, replyCommentId: string) {
    await CommentModel.findByIdAndUpdate(parentCommentId, { $push: { replies: replyCommentId } });
  }
  static async removeCmtToReplies(parentCommentId: string, CommentId: string) {
    await CommentModel.findByIdAndUpdate(parentCommentId, { $pull: { replies: CommentId } });
  }
}
