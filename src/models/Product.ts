import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  serial: string;
  category: string;
  price: number;
  discountPrice?: number;
  sizes: string[];
  status: "Available" | "Out of Stock" | "Coming Soon";
  description: {
    paragraph?: string;
    bullets?: string[];
  };
  images: string[];
  gender: "Men" | "Women" | "Unisex";
  season?: "Summer" | "Winter" | "Ramadan" | "All Season";
  tags: string[];
  isOffer: boolean;
  discountPercent: number;
  badgeText?: string;
  averageRating: number;
  reviewCount: number; // ← Changed from totalReviews to reviewCount
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    serial: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    sizes: [{ type: String }],
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Coming Soon"],
      default: "Available",
    },
    description: {
      paragraph: { type: String, default: "" },
      bullets: { type: [String], default: [] },
    },
    images: [{ type: String }],
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: true,
    },
    season: {
      type: String,
      enum: ["Summer", "Winter", "Ramadan", "All Season"],
    },
    tags: { type: [String], default: [] },
    isOffer: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    badgeText: { type: String },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 }, // ← Changed from totalReviews
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ title: "text", tags: "text" });
productSchema.index({ serial: 1 });
productSchema.index({ category: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ season: 1 });
productSchema.index({ isOffer: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });

export default mongoose.model<IProduct>("Product", productSchema);
