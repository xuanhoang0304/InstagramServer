import mongoose, { Schema, Document } from 'mongoose';

export enum EPermissions {
  ManageRole = 'manage-role',
  BlockedUser = 'blocked-user',
  BlockedPost = 'blocked-post',
  ManageAdmin = 'magage-admin',
}

export interface IPermission extends Document {
  name: string;
  description: string;
  permission: EPermissions;
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    permission: { type: String, enum: Object.values(EPermissions), required: true },
  },
  { timestamps: true },
);

export const PermissionModel = mongoose.model<IPermission>('Permission', PermissionSchema);
