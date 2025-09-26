import { Types } from 'mongoose';
import { BaseRepository } from '~/utils/baseRepository';

import { CreateNotify, NotifyFilters } from '../dtos/notify.dtos';
import { ETargetType, NotifyModel } from '../model/notify.model';

export class NotifyRepository {
  static getQueries(filters: NotifyFilters) {
    const conditions: Record<string, any> = {};
    if (filters.recipient) {
      conditions.recipient = new Types.ObjectId(filters.recipient);
    }
    return conditions;
  }
  static async checkNotifyExisted(data: CreateNotify) {
    const conditions = {
      type: data.type,
      sender: data.sender,
      recipient: data.recipient,
      'target.type': data.target.type,
      'target.target_id': new Types.ObjectId(data.target.target_id),
    };

    const now = new Date().toISOString();
    const result = await NotifyModel.findOneAndUpdate(
      conditions,
      {
        $set: {
          createdAt: now,
          updatedAt: now,
        },
      },
      {
        new: true,
        upsert: false,
      },
    );

    return result;
  }
  static async getPagination(filters: NotifyFilters) {
    const { sort, paginate } = await BaseRepository.getQuery(filters);
    const conditions = this.getQueries(filters);
    const [result, totalResult] = await Promise.all([
      NotifyModel.aggregate([
        { $match: conditions },
        { $sort: sort },
        {
          $group: {
            _id: {
              target: {
                target_id: '$target.target_id',
                type: '$target.type',
              },
              type: '$type',
            },
            latestNotification: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: {
            newRoot: '$latestNotification',
          },
        },
        { $sort: sort },
        { $skip: paginate.skip },
        { $limit: paginate.limit },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  avatar: 1,
                  isReal: 1,
                },
              },
            ],
          },
        },
        { $unwind: '$sender' },
      ]),
      NotifyModel.aggregate([
        { $match: conditions },
        { $sort: sort },
        {
          $group: {
            _id: {
              target: {
                target_id: '$target.target_id',
                type: '$target.type',
              },
              type: '$type',
            },
            latestNotification: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: {
            newRoot: '$latestNotification',
          },
        },
        { $sort: sort },
        { $count: 'total' },
      ]),
    ]);
    const finalResult = await NotifyModel.populate(result, {
      path: 'target.target_id',
      strictPopulate: false,
      populate: [
        {
          path: 'post',
          select: '_id media createdBy',
          strictPopulate: false,
        },
        {
          path: 'createdBy',
          select: '_id name avatar isReal',
          strictPopulate: false,
        },
      ],
    });
    return { result: finalResult, totalResult: totalResult[0]?.total || 0 };
  }
  static async createNotify(data: CreateNotify) {
    const result = (await NotifyModel.create(data)).toObject();
    return result;
  }
  static async deleteNotifyByTargetId(targetId: string, type: ETargetType) {
    await NotifyModel.deleteMany({
      'target.target_id': new Types.ObjectId(targetId),
      'target.type': type,
    });
  }
  static async getNotifyByTargetId(targetId: string, type: ETargetType) {
    const conditions = {
      'target.target_id': new Types.ObjectId(targetId),
      'target.type': type,
    };
    const result = await NotifyModel.findOne(conditions);
    return result;
  }
}
