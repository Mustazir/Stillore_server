import mongoose, { Schema, Document } from 'mongoose';

export interface ICountdownTimer extends Document {
  title: string;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const countdownTimerSchema = new Schema<ICountdownTimer>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      default: 'Special Offer',
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

countdownTimerSchema.index({ isActive: 1 });

export default mongoose.model<ICountdownTimer>('CountdownTimer', countdownTimerSchema);