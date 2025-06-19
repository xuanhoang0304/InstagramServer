import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupChat extends Document {
  members: mongoose.Schema.Types.ObjectId[];
  isGroup: boolean;
  createdBy: mongoose.Schema.Types.ObjectId;
  groupAvt: string;
  groupAdmin: mongoose.Schema.Types.ObjectId[];
  lastMessage: mongoose.Schema.Types.ObjectId;
  groupName: string;
}

const GroupSchema = new Schema<IGroupChat>(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    isGroup: { type: Boolean, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupAvt: { type: String, default: '' },
    groupAdmin: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    groupName: { type: String, default: '', index: true },
  },
  { timestamps: true },
);

export const GroupChatModel = mongoose.model<IGroupChat>('Group', GroupSchema);
