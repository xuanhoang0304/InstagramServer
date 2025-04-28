import { BaseFilters } from '@/utils/baseRepository';
import { EPostMediaType } from '../model/post.model';

export interface CreatePostDTO {
  media: EPostMediaType[];
  caption: string;
  isReel: boolean;
  curUserId: string;
}

export interface UpdatePostDTO {
  media: EPostMediaType[];
  caption: string;
  curUserId: string;
}

export interface PostFilters extends BaseFilters {
  createdBy?: string[];
  NotcreatedBy?: string[];
  isReel?: boolean;
  savedBy?: string[];
  excludes?: string[];
}
