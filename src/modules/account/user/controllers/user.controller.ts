import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UpdateUserDTO, UserFilters } from '~/modules/account/user/dtos/user.dto';
import { AppError } from '~/utils/app-error';
import { tryParseJson } from '~/utils/helpers';

import { HttpResponse } from '../../../../utils/httpResponse';
import { IUser } from '../model/user.model';
import { UserService } from '../services/user.service';

export class UserController {
  async getPaginate(req: Request, res: Response) {
    const { page = 1, limit = 10, sort, order, filters } = req.query;
    const filtersObj = tryParseJson(filters);
    const Usertfilters: UserFilters = {
      ...filtersObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await UserService.getPaginate(Usertfilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async getUserById(req: Request, res: Response) {
    const userId = req.params.id;
    const result = await UserService.getById(userId);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async getExploreUsers(req: Request, res: Response) {
    const user = req.user as IUser;
    const userId = String(user._id);
    const { page = 1, limit = 10, sort, order, filters } = req.query;
    const filtersObj = tryParseJson(filters);
    const Usertfilters: UserFilters = {
      ...filtersObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await UserService.getExploreUsers(userId, Usertfilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async registerUser(req: Request, res: Response) {
    const data = req.body;
    const result = await UserService.Register(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async followUser(req: Request, res: Response) {
    const user = req.user as IUser;
    const userId = String(user._id);
    const followId = req.params.id;
    const result = await UserService.followUser(userId, followId);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async savePost(req: Request, res: Response) {
    const user = req.user as IUser;
    const userId = String(user._id);
    const postId = req.params.postId;
    const result = await UserService.savePost(userId, postId);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async likePost(req: Request, res: Response) {
    const user = req.user as IUser;
    const userId = String(user._id);
    const postId = req.params.postId;
    const result = await UserService.likePost(userId, postId);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async updateInfo(req: Request, res: Response) {
    const curUser = req.user as IUser;
    const editUserId = req.params.id;
    if (String(curUser?._id) !== editUserId) {
      throw new AppError({
        id: 'UserController.updateInfo',
        message: "You can't edit other user's info",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }
    const data = req.body as UpdateUserDTO;
    const result = await UserService.updateInfo(editUserId, data);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
}
