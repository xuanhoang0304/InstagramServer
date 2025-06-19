import ConfignEnv from '@/config/env';
import { AdminSeeding } from '@/seeding/admin';
import { PermissionSeeding } from '@/seeding/permission';
import { RoleSeeding } from '@/seeding/role';
import { logger } from '@/utils/logger';

import { AdminModel } from '../model/admin.model';
import { PermissionModel } from '../model/permission.model';
import { RoleModel } from '../model/role.model';

export class RoleRepository {
  static async seedingDB() {
    if (ConfignEnv.SEEDING_PERMISSION) {
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
