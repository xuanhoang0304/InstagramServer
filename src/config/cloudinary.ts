import { Request } from 'express';

import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer, { FileFilterCallback } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import ConfignEnv from './env';

cloudinary.config({
  cloud_name: ConfignEnv.CLOUDINARY_CLOUD_NAME,
  api_key: ConfignEnv.CLOUDINARY_API_KEY,
  api_secret: ConfignEnv.CLOUDINARY_API_SECRET,
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.fieldname === 'image') {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and JPG files are allowed for images'));
    }

    cb(null, true);
  } else if (file.fieldname === 'video') {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(new Error('Only MP4 and MOV files are allowed for videos'));
    }

    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};
const Imagestorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'instagram-image',
  } as any,
});
const Videostorage = new CloudinaryStorage({
  cloudinary,

  params: {
    folder: 'instagram-video',

    resource_type: 'video',
  } as any,
});
export const UploadImageClient = multer({
  storage: Imagestorage,
  fileFilter,
});
export const UploadVideoClient = multer({
  storage: Videostorage,
  fileFilter,
});
