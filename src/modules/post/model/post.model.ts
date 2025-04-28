import mongoose, { Schema, Document } from 'mongoose';

export enum EPostMediaType {
  Image = 'image',
  Video = 'video',
}

export interface IPostMedia {
  type: EPostMediaType;
  path: string;
}

export interface IPost extends Document {
  media: Array<IPostMedia>;
  createdBy: mongoose.Schema.Types.ObjectId;
  caption: string;
  likes: mongoose.Schema.Types.ObjectId[];
  comments: mongoose.Schema.Types.ObjectId[];
  savedBy: mongoose.Schema.Types.ObjectId[];
  isReel: boolean;
}

const PostSchema = new Schema<IPost>(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    media: [{ type: Object, required: true }], // Danh sách ảnh/video {type: "image" | "video", path: string}
    caption: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Những ai đã lưu bài
    isReel: { type: Boolean, default: false }, // Phân biệt bài viết và reels
  },
  { timestamps: true },
);

export const PostModel = mongoose.model<IPost>('Post', PostSchema);
