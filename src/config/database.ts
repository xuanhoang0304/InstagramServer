import mongoose from 'mongoose';
import { RoleRepository } from '~/modules/account/user/repositories/role.repository';

import { logger } from '../utils/logger';
import ConfignEnv from './env';

const initMongoDb = async () => {
  try {
    await mongoose.connect(
      process.env.NODE_ENV === 'production'
        ? `mongodb+srv://${ConfignEnv.MONGO_USERNAME}:${ConfignEnv.MONGO_PASSWORD}@phamxuanhoang.tbkui.mongodb.net/instagram-clone?retryWrites=true&w=majority&appName=phamxuanhoang`
        : `${ConfignEnv.MONGO_URI}/clone-instagram`,
      {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      },
    );

    logger.info('✅ MongoDB Connected');
    await RoleRepository.seedingDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB', err);
    process.exit(1);
  }
};
export default initMongoDb;
