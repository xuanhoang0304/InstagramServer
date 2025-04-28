import cron from 'node-cron';
import { OtpModel } from '@/modules/account/otp/models/otp.model';

import { logger } from '@/utils/logger';

cron.schedule('*/10 * * * *', async () => {
  const now = new Date();
  console.log('now', now);
  try {
    const result = await OtpModel.deleteMany({
      expires: { $lt: now },
    });

    if (result.deletedCount > 0) {
      logger.info(`🧹 Đã xóa ${result.deletedCount} OTP hết hạn`);
    }
  } catch (err) {
    logger.error('❌ Lỗi khi xóa OTP hết hạn:', err);
  }
});
