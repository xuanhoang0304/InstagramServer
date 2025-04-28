import { PermissionSeeding } from './permission';

export const RoleSeeding = [
  {
    _id: '67f3f6f8be594bab0c0473dc',
    name: 'Quản trị hệ thống',
    description: 'Supper Admin được quyền quản lý toàn bộ hệ thống',
    permissions: PermissionSeeding.map((item) => item.permission),
    buildIn: true,
  },
];
