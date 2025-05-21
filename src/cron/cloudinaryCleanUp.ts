import cron from 'node-cron';

import { RedisDB } from '@/config/redis';
import { EPostMediaType } from '@/modules/post/model/post.model';
import { UploadService } from '@/modules/upload/services/upload.service';
import { logger } from '@/utils/logger';

cron.schedule('* * * * *', async () => {
  const redis = new RedisDB();

  // Lấy tất cả key image và video
  const imageKeys = await redis.getKeys('cloudinary-image*');
  const videoKeys = await redis.getKeys('cloudinary-video*');
  console.log('imageKeys', imageKeys);
  console.log('videoKeys', videoKeys);
  // Hàm kiểm tra key hết hạn và trích xuất public_id
  const getExpiredPublicIds = async (keys: any, prefix: any) => {
    const expiredPublicIds = [];

    for (const key of keys) {
      const ttl = await redis.getTTL(key); // Lấy TTL của key
      console.log('ttl', ttl);
      if (ttl === -2) {
        // Key đã hết hạn hoặc không tồn tại
        const publicId = key.replace(prefix, '');
        expiredPublicIds.push(publicId);
      }
    }

    return expiredPublicIds;
  };

  try {
    // Lấy public_id của các key đã hết hạn
    const expiredImages = await getExpiredPublicIds(imageKeys, 'cloudinary-image');
    const expiredVideos = await getExpiredPublicIds(videoKeys, 'cloudinary-video');

    // Kiểm tra nếu không có key nào hết hạn
    if (!expiredImages.length && !expiredVideos.length) {
      logger.info('🧹 Không có key Cloudinary nào hết hạn');
      return;
    }

    // Xóa các image hết hạn
    if (expiredImages.length > 0) {
      await UploadService.deleteFileByPaths(expiredImages, EPostMediaType.Image);
      await Promise.all(expiredImages.map((item) => redis.deleteKey(`cloudinary-image${item}`)));
      logger.info(`🧹 Đã xóa ${expiredImages.length} image Cloudinary hết hạn`);
    }

    // Xóa các video hết hạn
    if (expiredVideos.length > 0) {
      await UploadService.deleteFileByPaths(expiredVideos, EPostMediaType.Video);
      await Promise.all(expiredVideos.map((item) => redis.deleteKey(`cloudinary-video${item}`)));
      logger.info(`🧹 Đã xóa ${expiredVideos.length} video Cloudinary hết hạn`);
    }
  } catch (err) {
    logger.error('❌ Lỗi khi xóa Cloudinary hết hạn:', err);
  }
});
