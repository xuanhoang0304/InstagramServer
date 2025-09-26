import { Types } from 'mongoose';
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
        .populate('sender', 'email name avatar isReal')
        .populate('parentMessage', 'text images videos sender parentMessage groupId'),
      MessageModel.find(conditions).countDocuments(),
    ]);
    return {
      result,
      totalResult,
    };
  }
  static async getMessageById(msgId: string) {
    const result = await MessageModel.findById(msgId).populate(
      'sender',
      'email name avatar isReal',
    );
    return result;
  }
  static async getMessageByGroupId(groupId: string) {
    const result = await MessageModel.find({ groupId });
    return result;
  }
  static async createMessage(data: CreateMessage, curUserId: string) {
    const message = (
      await MessageModel.create({
        ...data,
        sender: curUserId,
        parentMessage: data.parentMessage || null,
      })
    ).toObject();

    const result = await MessageModel.findById(message._id)
      .populate('sender', 'email name avatar isReal')
      .populate({
        path: 'parentMessage',
        select: 'text images videos sender createdAt groupId',
        populate: { path: 'sender', select: 'email name avatar isReal' },
      });

    return result;
  }
  static async deleteMessage(msgId: string) {
    const result = await MessageModel.findByIdAndDelete(msgId, { new: true });
    return result;
  }
  static async getMessageMediaFileByGroupId(groupId: string, messageFilters: MessageFilter) {
    const { paginate } = BaseRepository.getQuery(messageFilters);

    const [result, totalResult] = await Promise.all([
      MessageModel.aggregate([
        // 1. Lọc tin nhắn có media
        {
          $match: {
            groupId: new Types.ObjectId(groupId),
            $or: [{ videos: { $ne: [] } }, { images: { $ne: [] } }],
          },
        },

        // 2. Giữ các field cần thiết
        {
          $project: {
            createdAt: 1,
            sender: 1,
            images: 1,
            videos: 1,
            messageId: '$_id',
          },
        },

        // 3. Tạo dateOnly
        {
          $addFields: {
            dateOnly: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
        },

        // 4. Biến đổi images + videos thành media, giữ lại sender
        {
          $project: {
            dateOnly: 1,
            sender: 1,
            createdAt: 1,
            messageId: 1,
            media: {
              $concatArrays: [
                {
                  $map: {
                    input: { $ifNull: ['$images', []] },
                    as: 'img',
                    in: {
                      type: 'image',
                      path: '$$img.path',
                      sender: '$sender',
                      createdAt: '$createdAt',
                      messageId: '$messageId',
                    },
                  },
                },
                {
                  $map: {
                    input: { $ifNull: ['$videos', []] },
                    as: 'vid',
                    in: {
                      type: 'video',
                      path: '$$vid.path',
                      sender: '$sender',
                      createdAt: '$createdAt',
                      messageId: '$messageId',
                    },
                  },
                },
              ],
            },
          },
        },

        // 5. Unwind từng media item
        {
          $unwind: '$media',
        },

        // 6. $lookup để populate sender (chỉ lấy các field cần thiết)
        {
          $lookup: {
            from: 'users', // tên collection của User
            localField: 'media.sender',
            foreignField: '_id',
            as: 'media.senderInfo',
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                  avatar: 1,
                  isReal: 1,
                  // thêm các field bạn muốn hiển thị
                },
              },
            ],
          },
        },

        // 7. Lấy phần tử đầu tiên của mảng senderInfo (vì $lookup trả về array)
        {
          $addFields: {
            'media.sender': {
              $arrayElemAt: ['$media.senderInfo', 0],
            },
          },
        },

        // 8. Xóa field phụ không cần thiết
        {
          $project: {
            'media.senderInfo': 0,
          },
        },

        // 9. Group lại theo ngày
        {
          $group: {
            _id: '$dateOnly',
            media: {
              $push: {
                type: '$media.type',
                path: '$media.path',
                createdAt: '$media.createdAt',
                sender: '$media.sender', // đã được populate đầy đủ
                messageId: '$media.messageId',
              },
            },
            totalMedia: { $sum: 1 },
          },
        },

        // 10. Sắp xếp media trong mỗi ngày mới nhất trước (tuỳ chọn)
        {
          $addFields: {
            media: {
              $sortArray: { input: '$media', sortBy: { createdAt: -1 } },
            },
          },
        },

        // 11. Sắp xếp theo ngày (mới → cũ)
        {
          $sort: { _id: -1 },
        },

        // 12. Phân trang
        {
          $skip: paginate.skip,
        },
        {
          $limit: paginate.limit,
        },
      ]),
      MessageModel.aggregate([
        // 1. Lọc tin nhắn có media
        {
          $match: {
            groupId: new Types.ObjectId(groupId),
            $or: [{ videos: { $ne: [] } }, { images: { $ne: [] } }],
          },
        },

        // 2. Chỉ giữ các field cần thiết
        {
          $project: {
            createdAt: 1,
            images: 1,
            videos: 1,
          },
        },

        // 3. Tạo dateOnly
        {
          $addFields: {
            dateOnly: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
        },

        // 4. Gộp images + videos thành media
        {
          $addFields: {
            media: {
              $concatArrays: [
                {
                  $ifNull: [
                    {
                      $map: {
                        input: '$images',
                        as: 'img',
                        in: { type: 'image', path: '$$img.path' },
                      },
                    },
                    [],
                  ],
                },
                {
                  $ifNull: [
                    {
                      $map: {
                        input: '$videos',
                        as: 'vid',
                        in: { type: 'video', path: '$$vid.path' },
                      },
                    },
                    [],
                  ],
                },
              ],
            },
          },
        },

        // 5. Xóa images, videos cũ
        {
          $project: {
            images: 0,
            videos: 0,
          },
        },

        // 6. Unwind media để mỗi phần tử là 1 media riêng
        {
          $unwind: '$media',
        },
        {
          $group: {
            _id: null,
            totalMedia: { $sum: 1 },
          },
        },
      ]),
    ]);
    const totalMedia = totalResult[0]?.totalMedia ?? 0;
    return { list: result, totalMedia };
  }
}
