import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ENotifyType {
  likePost = 'like-post',
  commentPost = 'comment-post',
  followUser = 'follow-user',
  replyComment = 'reply-comment',
  savePost = 'save-post',
  system = 'system',
}
export enum ENotifyStatus {
  pending = 'pending',
  read = 'read',
  deleted = 'deleted',
}
export enum ETargetType {
  Post = 'Post',
  Comment = 'Comment',
  User = 'User',
}
export interface INotifyTarget {
  type: ETargetType;
  target_id: Types.ObjectId;
}
export interface INotify extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  recipient: mongoose.Schema.Types.ObjectId;
  title: string;
  content: string;
  type: ENotifyType;
  status: ENotifyStatus;
  target: INotifyTarget;
}

const NotifySchema = new Schema<INotify>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    type: { type: String, enum: Object.values(ENotifyType), required: true },
    status: {
      type: String,
      enum: Object.values(ENotifyStatus),
      default: ENotifyStatus.pending,
    },
    target: {
      type: {
        type: String,
        enum: Object.values(ETargetType),
        required: true,
      },
      target_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'target.type',
      },
    },
  },
  { timestamps: true },
);
export const NotifyModel = mongoose.model<INotify>('Notify', NotifySchema);
