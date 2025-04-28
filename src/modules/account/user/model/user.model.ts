import mongoose, { Schema, Document } from 'mongoose';

export enum EUserGender {
  Male = 'male',
  Female = 'female',
  NA = 'N/A',
}

export enum EAuthProvider {
  Account = 'account',
  Google = 'google',
}

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: EUserGender;
  password: string;
  avatar: string;
  website: string;
  bio: string;
  followers: mongoose.Schema.Types.ObjectId[];
  followings: mongoose.Schema.Types.ObjectId[];
  saved: mongoose.Schema.Types.ObjectId[];
  provider: EAuthProvider;
  isReal: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      validate: {
        validator(this, value) {
          return this.provider !== EAuthProvider.Account || !!value;
        },
        message: 'Password is required',
      },
    },
    gender: { type: String, enum: Object.values(EUserGender), default: EUserGender.NA },
    username: { type: String, required: true, unique: true },
    phoneNumber: { type: String, default: '' },
    avatar: { type: String, default: '' },
    website: { type: String, default: '' },
    bio: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    provider: {
      type: String,
      enum: Object.values(EAuthProvider),
      required: true,
      default: EAuthProvider.Account,
    },
    isReal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
