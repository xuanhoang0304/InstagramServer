import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  createdBy: mongoose.Schema.Types.ObjectId;
  content: string;
  post: mongoose.Schema.Types.ObjectId;
  likes: mongoose.Schema.Types.ObjectId[];
  replies: mongoose.Schema.Types.ObjectId[];
  parentCommentId: mongoose.Schema.Types.ObjectId;
  replyCommentId: mongoose.Schema.Types.ObjectId | null;
}

const CommentSchema = new Schema<IComment>(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    parentCommentId: { type: mongoose.Schema.ObjectId, ref: 'Comment' },
    replyCommentId: { type: mongoose.Schema.ObjectId || null, ref: 'Comment', default: null },
  },
  { timestamps: true },
);

export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema);
