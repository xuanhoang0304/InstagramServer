import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HttpResponse } from '@/utils/httpResponse';
import { AdminService } from '../services/admin.service';
import { CreateAdminDTO } from '../dtos/admin.dto';

export class AdminController {
  async login(req: Request, res: Response) {
    const data = req.body;
    const result = await AdminService.login(data);
    res.status(StatusCodes.OK).json(HttpResponse.login(result));
  }
  async create(req: Request, res: Response) {
    const data = req.body as CreateAdminDTO;
    const result = await AdminService.create(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async getMe(req: Request, res: Response) {
    const userId = req.headers.userId as string;
    const result = await AdminService.getMe(userId);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
}
