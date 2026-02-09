import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    photoURL: { type: String },
    phone: { type: String },
    address: { type: String },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });

export default mongoose.model<IUser>('User', userSchema);