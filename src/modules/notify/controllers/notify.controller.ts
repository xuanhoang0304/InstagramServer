import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { tryParseJson } from '~/utils/helpers';
import { HttpResponse } from '~/utils/httpResponse';

import { NotifyFilters } from '../dtos/notify.dtos';
import { NotifyService } from '../services/notify.service';

export class NotifyController {
  async getPagination(req: Request, res: Response) {
    const { page = 1, limit = 10, sort, order, filters, sorts } = req.query;
    const filtersObj = tryParseJson(filters);
    const notifyFilters: NotifyFilters = {
      ...filtersObj,
      sorts,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await NotifyService.getPagination(notifyFilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
}
