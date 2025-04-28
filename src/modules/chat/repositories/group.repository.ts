import { BaseRepository } from '@/utils/baseRepository';
import { createGroupDTO, GroupFilters } from '../dtos/group.dtos';
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
          createdBy: filters.userId,
        },
        { members: { $in: [filters.userId] } },
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
  static async checkExistedGroupWithAllMembers(members: string[], isGroup: boolean) {
    const sortedMembers = members.sort();
    const result = await GroupChatModel.findOne({
      members: { $all: sortedMembers, $size: sortedMembers.length },
      isGroup,
    }).lean();
    return result;
  }
  static async createGroup(data: createGroupDTO) {
    const result = await GroupChatModel.create({
      ...data,
      groupAdmin: data.isGroup ? [data.createdBy] : [],
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
}
