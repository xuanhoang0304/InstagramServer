import { logger } from '@/utils/logger';
import { PermissionModel } from '../model/permission.model';
import { PermissionSeeding } from '@/seeding/permission';
import ConfignEnv from '@/config/env';
import { RoleSeeding } from '@/seeding/role';
import { RoleModel } from '../model/role.model';
import { AdminSeeding } from '@/seeding/admin';
import { AdminModel } from '../model/admin.model';

export class RoleRepository {
  static async seedingDB() {
    if (ConfignEnv.seedingPermission) {
      const promises: Promise<any>[] = [];
      PermissionSeeding.forEach((item) => {
        promises.push(
          PermissionModel.findOneAndUpdate({ permission: item.permission }, item, {
            upsert: true,
          }),
        );
      });
      RoleSeeding.forEach((item) => {
        promises.push(
          RoleModel.findOneAndUpdate({ _id: item._id }, item, {
            upsert: true,
          }),
        );
      });
      AdminSeeding.forEach((item) => {
        promises.push(
          AdminModel.findOneAndUpdate({ _id: item._id }, item, {
            upsert: true,
          }),
        );
      });
      await Promise.all(promises);
      logger.info('Seeding permission successfully');
    }
  }
}
