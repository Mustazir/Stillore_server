
import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSlide extends Document {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  link: string;
  type: 'image' | 'video';
  mediaUrl: string; // Image or video URL
  thumbnailUrl?: string; // Thumbnail for video
  duration?: number; // Duration in milliseconds for images (videos use actual video duration)
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    subtitle: {
      type: String,
      required: [true, 'Subtitle is required'],
      trim: true,
      maxlength: [100, 'Subtitle cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    cta: {
      type: String,
      required: [true, 'CTA text is required'],
      trim: true,
      maxlength: [50, 'CTA cannot exceed 50 characters'],
    },
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: [true, 'Type is required'],
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    videoUrl: {  // ✨ NEW FIELD - For the small preview video
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number,
      default: 5000,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 0,
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

export default mongoose.model<IHeroSlide>('HeroSlide', HeroSlideSchema);