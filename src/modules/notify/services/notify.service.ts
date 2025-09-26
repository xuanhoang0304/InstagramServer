import { CreateNotify, NotifyFilters } from '../dtos/notify.dtos';
import { NotifyRepository } from '../repositories/notify.repository';

export class NotifyService {
  static async getPagination(filters: NotifyFilters) {
    const result = await NotifyRepository.getPagination(filters);
    return result;
  }
  static async createNotify(data: CreateNotify) {
    const result = await NotifyRepository.createNotify(data);
    return result;
  }
}
