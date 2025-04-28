import mongoose, { Schema, Document } from 'mongoose';
import { EPermissions } from './permission.model';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: EPermissions[];
  buildIn: boolean;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: {
      type: [{ type: String, enum: Object.values(EPermissions), required: true }],
      required: true,
    },
    buildIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const RoleModel = mongoose.model<IRole>('Role', RoleSchema);
