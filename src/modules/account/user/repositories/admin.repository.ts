import { CreateAdminDTO } from '../dtos/admin.dto';
import { AdminModel } from '../model/admin.model';

export class AdminRepository {
  static async create(data: CreateAdminDTO) {
    const result = (await AdminModel.create({ ...data, buildIn: false })).toObject();
    return result;
  }
}
