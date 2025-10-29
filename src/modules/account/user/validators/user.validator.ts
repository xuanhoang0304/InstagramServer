import * as yup from 'yup';

import { EUserGender } from '../model/user.model';

type Gender = EUserGender;
const genderValues = Object.values(EUserGender) as EUserGender[];
export const RegisterUserSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .trim()
    .matches(/^[a-zA-Z0-9\s_]*$/, 'Name must not contain special characters')
    .max(30, 'Username must not exceed 20 characters')
    .min(3, 'Username must be at least 3 characters'),
  username: yup
    .string()
    .required('Username is required')
    .trim()
    .matches(
      /^[a-z0-9_]+$/,
      'Username can only contain lowercase letters, numbers, and underscores, no spaces or special characters',
    )
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters'),
  email: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .trim()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  gender: yup
    .mixed<Gender>()
    .oneOf(genderValues, 'Gender must be one of the following values: male, female, N/A'),
});

export const UpdateUserSchema = yup
  .object()
  .shape({
    name: yup
      .string()
      .trim()
      .matches(/^[a-zA-Z0-9\s_]*$/, 'Name must not contain special characters')
      .max(30, 'Username must not exceed 20 characters')
      .min(3, 'Username must be at least 3 characters'),
    avatar: yup.string().nullable(),
    gender: yup
      .mixed<Gender>()
      .oneOf(genderValues, 'Gender must be one of the following values: male, female, N/A'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    email: yup
      .string()
      .trim()
      .lowercase()
      .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  })
  .test(
    'at-least-one-required',
    'At least one of name, gender, or other info required.',
    (value) => !!(value.name || value.gender || value.avatar || value.email || value.password),
  );
