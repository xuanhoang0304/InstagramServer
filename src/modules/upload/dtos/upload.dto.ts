// Data Transfer Object (DTO)

import { IPostMedia } from '@/modules/post/model/post.model';

export interface RemoveFileDTO {
  paths: IPostMedia[];
}
