import { BaseFilters } from '~/utils/baseRepository';

import { IGroupChat } from '../model/group.chat.model';
import { IMessage } from '../model/message.model';

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
  action: 'add-member' | 'add-admin' | 'leave-group' | 'delete-member';
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

export type GroupsChatFilter = Omit<IGroupChat, 'lastMessage'> & {
  lastMessage: IMessage | null;
  _id: string;
};
