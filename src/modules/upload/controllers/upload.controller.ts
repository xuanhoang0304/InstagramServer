import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import ConfignEnv from '@/config/env';
import { EPostMediaType } from '@/modules/post/model/post.model';
import { AppError } from '@/utils/app-error';
import { HttpResponse } from '@/utils/httpResponse';

import { RemoveFileDTO } from '../dtos/upload.dto';
import { UploadService } from '../services/upload.service';

export class UploadController {
  static async uploadImage(request: Request, response: Response) {
    if (!request.file?.path) {
      throw new AppError({
        id: 'upload.controller.uploadImage',
        message: 'Tải ảnh thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (request.file.size > +ConfignEnv.MAX_SIZE_UPLOAD_IMG * 1024 * 1024) {
      const paths = [request.file.path];
      UploadService.deleteFileByPaths(paths, EPostMediaType.Image);
      throw new AppError({
        id: 'upload.controller.uploadImage',
        message: 'Ảnh vượt quá kích thước cho phép',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const data = { type: EPostMediaType.Image, path: request.file.path };
    response.status(StatusCodes.CREATED).json(HttpResponse.created(data));
  }
  static async uploadVideo(request: Request, response: Response) {
    if (!request.file?.path) {
      throw new AppError({
        id: 'upload.controller.uploadVideo',
        message: 'Tải video thất bại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (request.file.size > +ConfignEnv.MAX_SIZE_UPLOAD_VIDEO * 1024 * 1024) {
      const paths = [request.file.path];
      UploadService.deleteFileByPaths(paths, EPostMediaType.Video);
      throw new AppError({
        id: 'upload.controller.uploadVideo',
        message: 'Video vượt quá kích thước cho phép',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const data = { type: EPostMediaType.Video, path: request.file.path };
    response.status(StatusCodes.CREATED).json(HttpResponse.created(data));
  }
  static async removeFile(request: Request, response: Response) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { paths, resource_type } = request.body as RemoveFileDTO;

    await UploadService.deleteFileByPaths(paths, resource_type);

    response.status(StatusCodes.OK).json(HttpResponse.deleted({ data: paths }));
  }
}
