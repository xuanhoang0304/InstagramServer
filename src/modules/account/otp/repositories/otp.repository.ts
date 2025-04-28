import { OtpModel } from '../models/otp.model';

export class OtpRepository {
  static async createOtp(payload: any) {
    const newOtp = (await OtpModel.create(payload)).toObject();
    return newOtp;
  }
  static async getOtpByEmail(email: string) {
    const otp = await OtpModel.findOne({ email }).lean();
    return otp;
  }
  static async deleteOtp(email: string) {
    await OtpModel.deleteOne({ email });
  }
}
