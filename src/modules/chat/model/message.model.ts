import mongoose, { Schema, Document } from 'mongoose';

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
  images: string[];
  videos: string[];
  replies: mongoose.Schema.Types.ObjectId[];
  sender: mongoose.Schema.Types.ObjectId;
  seenBy: mongoose.Schema.Types.ObjectId[];
  reaction: EMessageReaction;
}

const MessageSchema = new Schema<IMessage>(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    text: { type: String },
    images: [{ type: String }],
    videos: [{ type: String }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reaction: {
      type: String,
      enum: Object.values(EMessageReaction),
      default: EMessageReaction.NORMAL,
    },
  },
  { timestamps: true },
);

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
