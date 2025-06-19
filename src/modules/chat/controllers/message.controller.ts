import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { IUser } from '@/modules/account/user/model/user.model';
import { tryParseJson } from '@/utils/helpers';
import { HttpResponse } from '@/utils/httpResponse';

import { CreateMessage, MessageFilter } from '../dtos/message.dtos';
import { MessageService } from '../services/message.services';

export class MessageController {
  async getPagination(req: Request, res: Response) {
    const { page = 1, limit = 10, sort, order, filters } = req.query;
    const filterObj = tryParseJson(filters);
    const messageFilters: MessageFilter = {
      ...filterObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };

    const result = await MessageService.getPagination(messageFilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async createMessage(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const data = req.body as CreateMessage;
    const result = await MessageService.CreateMessage(data, curUserId);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }

  async DeleteMessage(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const msgId = req.params.msgId;
    const result = await MessageService.DeleteMessage(msgId, curUserId);
    res.status(StatusCodes.CREATED).json(HttpResponse.deleted(result));
  }
}
