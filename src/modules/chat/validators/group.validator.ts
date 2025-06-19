import * as yup from 'yup';

export const creatGroupSchema = yup.object({
  members: yup.array(yup.string()).min(1, 'Phải có ít nhất 1 phần tử').required('FIELD_REQUIRED'),
  isGroup: yup.boolean().required('FIELD_REQUIRED'),
});

export const updateGroupMemberSchema = yup.object({
  members: yup.array(yup.string()).min(1, 'Phải có ít nhất 1 phần tử').required('FIELD_REQUIRED'),
});

export const updateGroupInfoSchema = yup.object({
  groupAvt: yup.string().trim(),
  groupName: yup.string().trim(),
});
