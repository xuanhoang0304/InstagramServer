import { BaseRepository } from '~/utils/baseRepository';

import { CreateMessage, MessageFilter } from '../dtos/message.dtos';
import { MessageModel } from '../model/message.model';

export class MessageRepository {
  static getQueries(filters: MessageFilter) {
    const conditions: Record<string, any> = {};
    if (filters.groupId) {
      conditions.groupId = filters.groupId;
    }
    if (filters.text) {
      conditions.text = { $regex: new RegExp(filters.text, 'i') };
    }
    return conditions;
  }
  static async getPagination(filters: MessageFilter) {
    const { sort, paginate } = await BaseRepository.getQuery(filters);
    const conditions = MessageRepository.getQueries(filters);
    const [result, totalResult] = await Promise.all([
      MessageModel.find(conditions)
        .sort(sort)
        .limit(paginate.limit)
        .skip(paginate.skip)
        .populate('sender', 'username email name avatar')
        .populate('parentMessage', 'text images videos sender parentMessage'),
      MessageModel.find(conditions).countDocuments(),
    ]);
    return {
      result,
      totalResult,
    };
  }
  static async CreateMessage(data: CreateMessage, curUserId: string) {
    const message = (
      await MessageModel.create({
        ...data,
        sender: curUserId,
        parentMessage: data.parentMessage || null,
      })
    ).toObject();

    const result = await MessageModel.findById(message._id)
      .populate('sender', 'username email name avatar')
      .populate({
        path: 'parentMessage',
        select: 'text images videos sender createdAt',
        populate: { path: 'sender', select: 'username email name avatar' },
      });

    return result;
  }
  static async deleteMessage(msgId: string) {
    const result = await MessageModel.findByIdAndDelete(msgId, { new: true });
    return result;
  }
}
