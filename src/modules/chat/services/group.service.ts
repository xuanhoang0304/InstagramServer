import { isArray, uniq } from 'lodash';
import { createGroupDTO, GroupFilters, updateMembersGroupDTO } from '../dtos/group.dtos';
import { AppError } from '@/utils/app-error';
import { StatusCodes } from 'http-status-codes';
import { GroupRepository } from '../repositories/group.repository';
import { BaseRepository } from '@/utils/baseRepository';
import { GroupChatModel } from '../model/group.chat.model';
import { UserService } from '@/modules/account/user/services/user.service';

export class GroupService {
  static async getGroups(filters: GroupFilters) {
    const result = await GroupRepository.getPagination(filters);
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

    const checkExistMember = async (memberId: string) => {
      const member = await UserService.getById(memberId);

      if (!member) {
        throw new AppError({
          id: 'GroupService.validateMembers',
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Người dùng này không tồn tại',
        });
      }
    };

    const promises = members.map(checkExistMember);

    await Promise.all(promises);
  };
  static async createGroupChat(data: createGroupDTO) {
    const { members, createdBy, isGroup } = data;
    await this.validateMembers(members);
    const memberIds = uniq([...members, createdBy]);
    if (!isGroup) {
      console.log('private');
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
        });
      }
    }
    const result = await GroupRepository.createGroup({ ...data, members: memberIds });
    return result;
  }
  static async addMembers(curUserId: string, groupId: string, data: updateMembersGroupDTO) {
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
  static async deleteMembers(curUserId: string, groupId: string, data: updateMembersGroupDTO) {
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
    //Tùy role có cho phép group có 1 người là chủ hay không . Nếu không cho phép thì xóa luôn group
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
}
