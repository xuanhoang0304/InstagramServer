import { BaseFilters } from '@/utils/baseRepository';

export interface createGroupDTO {
  members: string[];
  isGroup: boolean;
  createdBy: string;
}
export interface updateMembersGroupDTO {
  members: string[];
}
export interface GroupFilters extends BaseFilters {
  userId?: string;
  groupName?: string;
}
