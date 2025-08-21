import { StatusCodes } from 'http-status-codes';
import pkg from 'lodash';
import { UserService } from '~/modules/account/user/services/user.service';
import { AppError } from '~/utils/app-error';
import { BaseRepository } from '~/utils/baseRepository';

import {
  CreateGroupDTO,
  GroupFilters,
  GroupsChatFilter,
  UpdateGroup,
  UpdateMembersGroupDTO,
} from '../dtos/group.dtos';
import { GroupChatModel, IGroupChat } from '../model/group.chat.model';
import { GroupRepository } from '../repositories/group.repository';

const { isArray, orderBy, uniq } = pkg;

export class GroupService {
  static async getGroups(filters: GroupFilters) {
    const data = await GroupRepository.getPagination(filters);
    const groups: GroupsChatFilter[] = data.result.map((item) => ({
      ...item,
      lastMessage: item.lastMessage as any,
      _id: String(item._id),
    }));
    const sortedGroups = orderBy(groups, 'lastMessage.createdAt', 'desc');

    return { result: sortedGroups, totalResult: data.totalResult };
  }
  static async getById(id: string) {
    const result = (await GroupRepository.getById(id)) as IGroupChat;
    if (!result) {
      throw new AppError({
        id: 'GroupService.getById',
        message: 'Group is not existed',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    return result;
  }
  static validateMembers = async (members: string[]) => {
    if (!isArray(members) || !members.length) {
      throw new AppError({
        id: 'GroupService.validateMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dữ liệu không hợp lệ!',
      });
    }

    const memberName: string[] = [];

    const checkExistMember = async (memberId: string) => {
      const member = await UserService.getById(memberId);

      if (!member) {
        throw new AppError({
          id: 'GroupService.validateMembers',
          statusCode: StatusCodes.BAD_REQUEST,
          message: `Người dùng  không tồn tại`,
        });
      }
      memberName.push(member.name);
    };

    const promises = members.map(checkExistMember);

    await Promise.all(promises);
    return { memberName };
  };
  static async createGroupChat(data: CreateGroupDTO) {
    const { members, createdBy, isGroup } = data;
    const { memberName } = await this.validateMembers([...members, createdBy]);
    const groupName = data.groupName || (isGroup ? memberName.join() : '');

    const memberIds = uniq([...members, createdBy]);
    if (!isGroup) {
      if (memberIds.length !== 2) {
        throw new AppError({
          id: 'GroupService.createGroupChat',
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Priviate chat invalid members',
        });
      }
      const existedGroupPrivate = await GroupRepository.checkExistedGroupWithAllMembers(
        memberIds,
        isGroup,
      );
      if (existedGroupPrivate) {
        throw new AppError({
          id: 'GroupService.createGroupChat',
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Group chat is existed',
          detail: `${existedGroupPrivate._id}`,
        });
      }
    }

    const result = await GroupRepository.createGroup({
      ...data,
      members: memberIds,
      groupName,
    });
    return result;
  }
  static async addMembers(curUserId: string, groupId: string, data: UpdateMembersGroupDTO) {
    await this.validateMembers(data.members);
    const oldGroup = await BaseRepository.getById(GroupChatModel, groupId);
    if (!oldGroup) {
      throw new AppError({
        id: 'GroupService.addMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Group chat is not existed',
      });
    }
    if (!oldGroup.isGroup) {
      throw new AppError({
        id: 'GroupService.addMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Priviate chat invalid members',
      });
    }
    const groupMembers = oldGroup.members.map((id) => String(id));
    if (!groupMembers.includes(curUserId)) {
      throw new AppError({
        id: 'GroupService.addMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'You are not in this group',
      });
    }
    const newMember = uniq([...groupMembers, ...data.members]) as string[];
    const result = await GroupRepository.updateMembers(groupId, newMember);
    return result;
  }
  static async deleteMembers(curUserId: string, groupId: string, data: UpdateMembersGroupDTO) {
    await this.validateMembers(data.members);
    const oldGroup = await BaseRepository.getById(GroupChatModel, groupId);
    if (!oldGroup) {
      throw new AppError({
        id: 'GroupService.deleteMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Group chat is not existed',
      });
    }
    if (!oldGroup.isGroup) {
      throw new AppError({
        id: 'GroupService.deleteMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Private chat is not a group',
      });
    }
    const groupMembers = oldGroup.members.map((id) => String(id));

    const adminGroup = oldGroup.groupAdmin.map((id) => String(id));
    if (!groupMembers.includes(curUserId) || !adminGroup.includes(curUserId)) {
      throw new AppError({
        id: 'GroupService.deleteMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'You dont have permission in group',
      });
    }
    if (data.members.includes(String(oldGroup.createdBy))) {
      throw new AppError({
        id: 'GroupService.deleteMembers',
        statusCode: StatusCodes.BAD_REQUEST,
        message: "You cant delete owner's group",
      });
    }
    if (adminGroup.includes(curUserId) && data.members.includes(curUserId)) {
      GroupRepository.removeAdminGroup(curUserId, groupId);
    }
    const newMember = uniq(
      [...groupMembers].filter((item) => !data.members.includes(item)),
    ) as string[];
    const result = await GroupRepository.updateMembers(groupId, newMember);
    // Tùy role có cho phép group có 1 người là chủ hay không . Nếu không cho phép thì xóa luôn group
    // if (newMember.length === 1 && newMember[0] === String(oldGroup.createdBy)) {
    //   const result = await GroupRepository.deleteGroup(groupId);

    //   return result;
    // }
    return result;
  }
  static async deleteGroup(curUserId: string, groupId: string) {
    const group = await BaseRepository.getById(GroupChatModel, groupId);
    if (!group) {
      throw new AppError({
        id: 'GroupService.deleteGroup',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Group chat is not existed',
      });
    }
    if (!group.isGroup) {
      throw new AppError({
        id: 'GroupService.deleteGroup',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'This is not a group chat',
      });
    }
    if (curUserId !== String(group.createdBy)) {
      throw new AppError({
        id: 'GroupService.deleteGroup',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'You are not owner group',
      });
    }
    // Delete Many những Message có id = groupId
    // ......
    // Delete group
    const result = await GroupRepository.deleteGroup(groupId);
    return result;
  }
  static async updateGroup(groupId: string, data: UpdateGroup, curUserId: string) {
    const group = await BaseRepository.getById(GroupChatModel, groupId);
    if (!group) {
      throw new AppError({
        id: 'GroupService.UpdateGroup',
        message: 'Group is not existed',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const userInGroup = group.members.find((member) => String(member) === curUserId);
    if (!userInGroup) {
      throw new AppError({
        id: 'GroupService.UpdateGroup',
        message: 'User is not a member in group',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const result = await GroupRepository.updateGroup(data, groupId);
    return result;
  }
}
