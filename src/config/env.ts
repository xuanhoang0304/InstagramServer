import dotenv from 'dotenv';

dotenv.config();

const ConfignEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '',
  MONGO_URI: process.env.MONGO_URI || '',
  MONGO_USERNAME: process.env.MONGO_USERNAME,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET || '',
  GG_CLIENT_ID: process.env.GG_CLIENT_ID || '',
  GG_SECRET_ID: process.env.GG_CLIENT_ID || '',
  SEEDING_PERMISSION: process.env.SEEDING_PERMISSION || true,
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  MAX_SIZE_UPLOAD_IMG: process.env.MAX_SIZE_UPLOAD_IMG || 2,
  MAX_SIZE_UPLOAD_VIDEO: process.env.MAX_SIZE_UPLOAD_VIDEO || 5,
  FRONTEND_URL: process.env.FRONTEND_URL || '',
};

export default ConfignEnv;
