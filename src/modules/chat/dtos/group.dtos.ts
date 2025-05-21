import { BaseFilters } from '@/utils/baseRepository';

export interface CreateGroupDTO {
  members: string[];
  isGroup: boolean;
  createdBy: string;
  groupName?: string;
}
export interface UpdateMembersGroupDTO {
  members: string[];
}
export interface GroupFilters extends BaseFilters {
  userId?: string;
  groupName?: string;
}
