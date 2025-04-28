import * as yup from 'yup';
import { EPostMediaType } from '../model/post.model';

export const CreatPostSchema = yup.object({
  media: yup
    .array(
      yup.object({
        type: yup
          .mixed<EPostMediaType>()
          .oneOf(Object.values(EPostMediaType))
          .required('FIELD_REQUIRED'),
        path: yup.string().required('FIELD_REQUIRED'),
      }),
    )
    .min(1)
    .required('FIELD_REQUIRED'),
  caption: yup.string().trim(),
  isReel: yup.boolean().default(false),
});

export const updatePostSchema = yup.object({
  media: yup
    .array(
      yup.object({
        type: yup
          .mixed<EPostMediaType>()
          .oneOf(Object.values(EPostMediaType))
          .required('FIELD_REQUIRED'),
        path: yup.string().required(),
      }),
    )
    .min(1, 'FIELD_REQUIRED')
    .required('FIELD_REQUIRED'),
  caption: yup.string().trim(),
});
