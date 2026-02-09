import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  name: string;
  code: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 5
    },
    slug: { type: String, unique: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

});

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);