import { CreateNotify, NotifyFilters } from '../dtos/notify.dtos';
import { ETargetType } from '../model/notify.model';
import { NotifyRepository } from '../repositories/notify.repository';

export class NotifyService {
  static async getPagination(filters: NotifyFilters) {
    const result = await NotifyRepository.getPagination(filters);
    return result;
  }
  static async createNotify(data: CreateNotify) {
    const existedNotify = await NotifyRepository.checkNotifyExisted(data);
    if (existedNotify) return existedNotify;

    const result = await NotifyRepository.createNotify(data);
    return result;
  }
  static async deleteNotify(id: string) {
    const existedNotify = await NotifyRepository.getNotifyByTargetId(id, ETargetType.Comment);
    if (!existedNotify) {
      return;
    }
    await NotifyRepository.deleteNotifyByTargetId(
      String(existedNotify.target.target_id),
      existedNotify.target.type,
    );
  }
}
