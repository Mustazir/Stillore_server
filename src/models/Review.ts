import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userPhoto: {
      type: String
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      minlength: 10
    },
    images: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 }); // For admin getAllReviews sorting
reviewSchema.index({ rating: 1 }); // For filtering by rating

// Ensure one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;