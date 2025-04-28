import * as yup from 'yup';

export const CreateAdminSchema = yup.object({
  name: yup.string().required('FIELD_REQUIRED').trim(),
  email: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'FIELD_FORMAT')
    .required('Email is required'),
  role: yup.string().required('FIELD_REQUIRED'),
  password: yup.string(),
  buildIn: yup.boolean().default(false),
});

export const LoginAdminSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'FIELD_FORMAT')
    .required('Email is required'),
  password: yup.string().required('FIELD_REQUIRED'),
});
