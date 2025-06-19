import { IPostMedia } from '@/modules/post/model/post.model';
import { BaseFilters } from '@/utils/baseRepository';

export interface CreateMessage {
  groupId: string;
  text?: string;
  images?: IPostMedia[];
  videos?: IPostMedia[];
  parentMessage?: string | null;
}
export interface MessageFilter extends BaseFilters {
  groupId?: string;
  text?: string;
}
