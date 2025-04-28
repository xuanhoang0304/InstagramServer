import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: mongoose.Schema.Types.ObjectId;
  buildIn: boolean;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      default: 'admin',
    },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    buildIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AdminModel = mongoose.model<IAdmin>('Admin', AdminSchema);
