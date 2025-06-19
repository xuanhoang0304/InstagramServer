import mongoose from 'mongoose';

import { RoleRepository } from '@/modules/account/user/repositories/role.repository';

// import { RoleRepository } from '@/modules/account/user/repositories/role.repository';
import { logger } from '../utils/logger';
import ConfignEnv from './env';

const initMongoDb = async () => {
  try {
    await mongoose.connect(`${ConfignEnv.MONGO_URI}clone-instagram`);
    // await mongoose.connect(
    //   `mongodb+srv://${ConfignEnv.MONGO_USERNAME}:${ConfignEnv.MONGO_PASSWORD}@phamxuanhoang.tbkui.mongodb.net/instagram-clone?retryWrites=true&w=majority&appName=phamxuanhoang  `,
    // );
    logger.info('✅ MongoDB Connected');
    await RoleRepository.seedingDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB', err);
    process.exit(1);
  }
};
export default initMongoDb;
