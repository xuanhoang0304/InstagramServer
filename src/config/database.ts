import mongoose from 'mongoose';
import ConfignEnv from './env';
import { logger } from '../utils/logger';
import { RoleRepository } from '@/modules/account/user/repositories/role.repository';

const initMongoDb = async () => {
  try {
    await mongoose.connect(`${ConfignEnv.mongo_uri}clone-instagram`);
    logger.info('✅ MongoDB Connected');
    await RoleRepository.seedingDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB', err);
    process.exit(1);
  }
};
export default initMongoDb;
