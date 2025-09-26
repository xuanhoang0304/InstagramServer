import * as yup from 'yup';

export const createCommentSchema = yup.object({
  content: yup.string().trim().required('FIELD_REQUIRED'),
  postId: yup.string().required('FIELD_REQUIRED'),
});

export const updateCommentSchema = yup.object({
  content: yup.string().trim().required('FIELD_REQUIRED'),
});

export const createReplyCommentSchema = yup.object({
  content: yup.string().trim().required('FIELD_REQUIRED'),
  postId: yup.string().required('FIELD_REQUIRED'),
  replyCommentId: yup.string().required('FIELD_REQUIRED'),
});
