import { BaseFilters } from '@/utils/baseRepository';

export interface CreateGroupDTO {
  members: string[];
  isGroup: boolean;
  createdBy: string;
  groupName?: string;
  lastMessage?: string;
  groupAvt?: string;
}
export interface UpdateMembersGroupDTO {
  members: string[];
}
export interface UpdateGroup {
  groupAvt?: string;
  lastMessage?: string | null;
  groupName?: string;
}
export interface GroupFilters extends BaseFilters {
  userId?: string;
  groupName?: string;
}
