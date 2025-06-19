import mongoose, { Document, Schema } from 'mongoose';

import { IPostMedia } from '@/modules/post/model/post.model';

export enum EMessageReaction {
  LIKE = 'LIKE',
  HAHA = 'HAHA',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  LOVE = 'LOVE',
  NORMAL = '',
}
export interface IMessage extends Document {
  groupId: mongoose.Schema.Types.ObjectId;
  text: string;
  images: IPostMedia[];
  videos: IPostMedia[];
  replies: mongoose.Schema.Types.ObjectId[];
  sender: mongoose.Schema.Types.ObjectId;
  seenBy: mongoose.Schema.Types.ObjectId[];
  parentMessage: mongoose.Schema.Types.ObjectId | null;
  reaction: EMessageReaction;
}

const MessageSchema = new Schema<IMessage>(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    text: { type: String, index: true },
    images: [{ type: Object }],
    videos: [{ type: Object }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentMessage: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Message' },
    reaction: {
      type: String,
      enum: Object.values(EMessageReaction),
      default: EMessageReaction.NORMAL,
    },
  },
  { timestamps: true },
);

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
