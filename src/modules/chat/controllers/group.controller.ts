import { GroupFilters } from './../dtos/group.dtos';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IUser } from '@/modules/account/user/model/user.model';
import { HttpResponse } from '@/utils/httpResponse';
import { createGroupDTO, updateMembersGroupDTO } from '../dtos/group.dtos';
import { GroupService } from '../services/group.service';
import { tryParseJson } from '@/utils/helpers';

export class GroupController {
  async getGroups(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const { page = 1, limit = 10, sort, order, filter } = req.query;
    const filterObj = tryParseJson(filter);
    const GroupFilters: GroupFilters = {
      ...filterObj,
      userId: curUserId,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await GroupService.getGroups(GroupFilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async create(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const data = { ...req.body, createdBy: curUserId } as createGroupDTO;
    const result = await GroupService.createGroupChat(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async addMembers(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const data = req.body as updateMembersGroupDTO;
    const result = await GroupService.addMembers(curUserId, groupId, data);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async deleteMembers(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const data = req.body as updateMembersGroupDTO;
    const result = await GroupService.deleteMembers(curUserId, groupId, data);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async deleteGroup(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const result = await GroupService.deleteGroup(curUserId, groupId);
    res.status(StatusCodes.OK).json(HttpResponse.deleted(result));
  }
}
