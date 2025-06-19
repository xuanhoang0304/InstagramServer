import { StatusCodes } from 'http-status-codes';

import { UploadService } from '@/modules/upload/services/upload.service';
import { AppError } from '@/utils/app-error';
import { BaseRepository } from '@/utils/baseRepository';

import { CreateMessage, MessageFilter } from '../dtos/message.dtos';
import { GroupChatModel } from '../model/group.chat.model';
import { MessageModel } from '../model/message.model';
import { GroupRepository } from '../repositories/group.repository';
import { MessageRepository } from '../repositories/message.repository';
import { GroupService } from './group.service';

export class MessageService {
  static async getPagination(filters: MessageFilter) {
    if (filters.groupId) {
      const group = await BaseRepository.getById(GroupChatModel, filters.groupId as string);
      if (!group) {
        throw new AppError({
          id: 'ChatService.CreateMessage',
          message: 'Group chat không tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }
    const result = await MessageRepository.getPagination(filters);
    return result;
  }
  static async CreateMessage(data: CreateMessage, curUserId: string) {
    const group = await GroupService.getById(data.groupId);
    if (!group) {
      throw new AppError({
        id: 'ChatService.CreateMessage',
        message: 'Group chat không tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    if (!data.text && !data.images && !data.videos) {
      throw new AppError({
        id: 'ChatService.CreateMessage',
        message: 'Tin nhắn không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const finalData: CreateMessage = data.parentMessage
      ? { ...data, parentMessage: data.parentMessage }
      : data;
    const result = await MessageRepository.CreateMessage(finalData, curUserId);
    GroupRepository.updateGroup({ ...group, lastMessage: result?._id as string }, data.groupId);
    return result;
  }
  static async DeleteMessage(msgId: string, curUserId: string) {
    const message = await BaseRepository.getById(MessageModel, msgId);
    if (!message) {
      throw new AppError({
        id: 'MessageService.DeleteMessage',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Message is not existed',
      });
    }
    if (String(message.sender) !== curUserId) {
      throw new AppError({
        id: 'MessageService.DeleteMessage',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'You are not sender message',
      });
    }
    const result = await MessageRepository.deleteMessage(String(message._id));
    const media = [...message.images, ...message.videos];
    if (media.length) {
      UploadService.deleteFileByPaths(media);
    }
    return result;
  }
}
