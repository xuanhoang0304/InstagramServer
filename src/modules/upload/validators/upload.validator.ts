import * as yup from 'yup';

import { EPostMediaType } from '@/modules/post/model/post.model';

export const removeFileSchema = yup.object({
  paths: yup
    .array(yup.string().required('FIELD_REQUIRED'))
    .min(1, 'FIELD_REQUIRED')
    .required('FIELD_REQUIRED'),
  resource_type: yup
    .mixed<EPostMediaType>()
    .oneOf(Object.values(EPostMediaType))
    .required('FIELD_REQUIRED'),
});
