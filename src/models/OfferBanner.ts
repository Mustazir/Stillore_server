import mongoose, { Schema, Document } from 'mongoose';

export interface IOfferBanner extends Document {
  title: string;
  description: string;
  discountText: string;
  buttonText: string;
  buttonLink: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const offerBannerSchema = new Schema<IOfferBanner>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    discountText: {
      type: String,
      required: [true, 'Discount text is required'],
      trim: true,
    },
    buttonText: {
      type: String,
      required: [true, 'Button text is required'],
      trim: true,
      default: 'Shop Now',
    },
    buttonLink: {
      type: String,
      required: [true, 'Button link is required'],
      trim: true,
    },
    backgroundGradientFrom: {
      type: String,
      default: '#f97316',
    },
    backgroundGradientTo: {
      type: String,
      default: '#dc2626',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

offerBannerSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IOfferBanner>('OfferBanner', offerBannerSchema);