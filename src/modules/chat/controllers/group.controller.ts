import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IUser } from '~/modules/account/user/model/user.model';
import { tryParseJson } from '~/utils/helpers';
import { HttpResponse } from '~/utils/httpResponse';

import {
  CreateGroupDTO,
  GroupFilters,
  UpdateGroup,
  UpdateMembersGroupDTO,
} from '../dtos/group.dtos';
import { GroupService } from '../services/group.service';

export class GroupController {
  async getGroups(req: Request, res: Response) {
    const { page = 1, limit = 10, sort, order, filter } = req.query;
    const filterObj = tryParseJson(filter);
    const groupFilters: GroupFilters = {
      ...filterObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await GroupService.getGroups(groupFilters);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async getById(req: Request, res: Response) {
    const groupId = req.params.groupId;
    const result = await GroupService.getById(groupId);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async create(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const data = { ...req.body, createdBy: curUserId } as CreateGroupDTO;
    const result = await GroupService.createGroupChat(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async addMembers(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const data = req.body as UpdateMembersGroupDTO;
    const result = await GroupService.addMembers(curUserId, groupId, data);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async deleteMembers(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const data = req.body as UpdateMembersGroupDTO;
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
  async updateGroup(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const groupId = req.params.groupId;
    const data = req.body as UpdateGroup;
    const result = await GroupService.updateGroup(groupId, data, curUserId);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
}
