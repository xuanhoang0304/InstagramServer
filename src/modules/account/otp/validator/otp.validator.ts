import * as yup from 'yup';
import { ETypeOTP } from '../models/otp.model';

type TypeOTP = ETypeOTP;
const typeOTPValues = Object.values(ETypeOTP) as ETypeOTP[];
export const otpSchema = yup.object({
  email: yup
    .string()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
    .required('Email is required'),
  otp: yup.string(),
  typeOTP: yup
    .mixed<TypeOTP>()
    .oneOf(typeOTPValues, 'Gender must be one of the following values: REGISTER, FORGET')
    .required('Type OTP is required'),
});

export const VerifyOtpSchema = yup.object({
  email: yup
    .string()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
    .required('Email is required'),
  otp: yup.string().required('OTP is required'),
});
