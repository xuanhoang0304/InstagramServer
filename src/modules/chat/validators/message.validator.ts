import * as yup from 'yup';

import { EPostMediaType } from '@/modules/post/model/post.model';

export const createMessage = yup.object({
  groupId: yup.string().required().length(24, 'Unformat object id'),
  text: yup.string().trim(),
  images: yup.array(
    yup.object({
      type: yup
        .mixed<EPostMediaType>()
        .oneOf(Object.values(EPostMediaType))
        .required('FIELD_REQUIRED'),
      path: yup.string().required('FIELD_REQUIRED'),
    }),
  ),
  videos: yup.array(
    yup.object({
      type: yup
        .mixed<EPostMediaType>()
        .oneOf(Object.values(EPostMediaType))
        .required('FIELD_REQUIRED'),
      path: yup.string().required('FIELD_REQUIRED'),
    }),
  ),
});
