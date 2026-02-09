import mongoose, { Document, Schema } from 'mongoose';

export interface IDynamicLink extends Document {
  label: string;
  type: 'season' | 'custom';
  value: string;
  path?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const dynamicLinkSchema = new Schema<IDynamicLink>(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['season', 'custom'],
      required: true
    },
    value: {
      type: String,
      required: true
    },
    path: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

dynamicLinkSchema.index({ isActive: 1 });
dynamicLinkSchema.index({ order: 1 });

export default mongoose.model<IDynamicLink>('DynamicLink', dynamicLinkSchema);