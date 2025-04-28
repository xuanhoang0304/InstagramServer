import mongoose, { Document, Schema } from 'mongoose';
import '../../user/model/user.model';

export enum ETypeOTP {
  REGISTER = 'REGISTER',
  FORGET = 'FORGET',
}
export interface IOtp extends Document {
  email: string;
  otp: string;
  expires: Date;
  typeOTP: ETypeOTP;
}
const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    otp: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    typeOTP: { type: String, enum: Object.values(ETypeOTP), required: true },
  },
  { timestamps: true },
);

export const OtpModel = mongoose.model<IOtp>('Otp', OtpSchema);
