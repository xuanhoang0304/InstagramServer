import { Types } from 'mongoose';

import { BaseRepository } from '@/utils/baseRepository';

import { CreateGroupDTO, GroupFilters, UpdateGroup } from '../dtos/group.dtos';
import { GroupChatModel } from '../model/group.chat.model';

export class GroupRepository {
  static getQueries(filters: GroupFilters) {
    const conditions: Record<string, any> = {};
    if (filters.groupName) {
      conditions.groupName = { $regex: new RegExp(filters.groupName, 'i') };
    }
    if (filters.userId) {
      conditions.$or = [
        {
          createdBy: new Types.ObjectId(filters.userId),
          lastMessage: { $ne: null },
        },
        { members: { $in: [new Types.ObjectId(filters.userId)] }, lastMessage: { $ne: null } },
      ];
    }
    return conditions;
  }
  static async getPagination(filters: GroupFilters) {
    const condition = this.getQueries(filters);
    const { sort, paginate } = await BaseRepository.getQuery(filters);
    const [result, totalResult] = await Promise.all([
      GroupChatModel.find(condition)
        .sort(sort)
        .populate('members', 'username email name avatar')
        .populate('createdBy', 'username email name avatar')
        .skip(paginate.skip)
        .limit(paginate.limit)
        .lean(),
      GroupChatModel.find(condition).countDocuments(),
    ]);
    return {
      result,
      totalResult,
    };
  }
  static async getById(id: string) {
    const result = await GroupChatModel.findById(new Types.ObjectId(id))
      .populate('members', 'username email name avatar')
      .populate('createdBy', 'username email name avatar')
      .lean();
    return result;
  }

  static async checkExistedGroupWithAllMembers(members: string[], isGroup: boolean) {
    const sortedMembers = members.sort();
    const result = await GroupChatModel.findOne({
      members: { $all: sortedMembers, $size: sortedMembers.length },
      isGroup,
    }).lean();
    return result;
  }
  static async createGroup(data: CreateGroupDTO) {
    const result = await GroupChatModel.create({
      ...data,
      groupAdmin: data.isGroup ? [data.createdBy] : [],
      lastMessage: data.isGroup ? '680b20896a98cf92714035f6' : null,
    });
    return result;
  }
  static async updateMembers(groupId: string, members: string[]) {
    const result = await GroupChatModel.findByIdAndUpdate(
      groupId,
      { members },
      { new: true },
    ).lean();
    return result;
  }
  static async deleteGroup(id: string) {
    const result = await GroupChatModel.findByIdAndDelete(id, { new: true }).lean();
    return result;
  }
  static async removeAdminGroup(userId: string, groupId: string) {
    await GroupChatModel.findByIdAndUpdate(groupId, {
      $pull: {
        groupAdmin: userId,
      },
    });
  }
  static async updateGroup(data: UpdateGroup, id: string) {
    const result = await GroupChatModel.findByIdAndUpdate(id, data, { new: true });
    return result;
  }
}
