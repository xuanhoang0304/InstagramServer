import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';
import ConfignEnv from '~/config/env';
import { EPostMediaType, IPostMedia } from '~/modules/post/model/post.model';

cloudinary.config({
  cloud_name: ConfignEnv.CLOUDINARY_CLOUD_NAME,
  api_key: ConfignEnv.CLOUDINARY_API_KEY,
  api_secret: ConfignEnv.CLOUDINARY_API_SECRET,
});

export class UploadService {
  static async deleteFileByPath(path: string, resource_type: EPostMediaType) {
    const publicId = extractPublicId(path);
    await cloudinary.uploader.destroy(publicId, { resource_type });
  }

  static deleteFileByPaths = async (paths: IPostMedia[]) => {
    const promises = paths.map((item) => UploadService.deleteFileByPath(item.path, item.type));
    await Promise.all(promises);
  };
}
