import dotenv from 'dotenv';

dotenv.config();

const ConfignEnv = {
  port: process.env.PORT || '',
  mongo_uri: process.env.MONGO_URI || '',
  jwt_secret: process.env.JWT_SECRET || '',
  GG_CLIENT_ID: process.env.GG_CLIENT_ID || '',
  GG_SECRET_ID: process.env.GG_CLIENT_ID || '',
  seedingPermission: process.env.SEEDING_PERMISSION || true,
  jwt_admin_secret: process.env.JWT_ADMIN_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  MAX_SIZE_UPLOAD_IMG: process.env.MAX_SIZE_UPLOAD_IMG || 2,
  MAX_SIZE_UPLOAD_VIDEO: process.env.MAX_SIZE_UPLOAD_VIDEO || 5,
};

export default ConfignEnv;
