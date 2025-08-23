import * as yup from 'yup';

enum Action {
  addMember = 'add-member',
  addAdmin = 'add-admin',
  leaveGroup = 'leave-group',
  deleteMember = 'delete-member',
}

export const creatGroupSchema = yup.object({
  members: yup.array(yup.string()).min(1, 'Phải có ít nhất 1 phần tử').required('FIELD_REQUIRED'),
  isGroup: yup.boolean().required('FIELD_REQUIRED'),
});

export const updateGroupMemberSchema = yup.object({
  members: yup.array(yup.string()).min(1, 'Phải có ít nhất 1 phần tử').required('FIELD_REQUIRED'),
  action: yup.string().oneOf(Object.values(Action), 'Action is invalid').required('FIELD_REQUIRED'),
});

export const updateGroupInfoSchema = yup.object({
  groupAvt: yup.string().trim(),
  groupName: yup.string().trim(),
});
