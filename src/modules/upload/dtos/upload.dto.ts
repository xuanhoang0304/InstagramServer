// Data Transfer Object (DTO)

import { EPostMediaType } from '@/modules/post/model/post.model';

export interface RemoveFileDTO {
  paths: string[];
  resource_type: EPostMediaType;
}
