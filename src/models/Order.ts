import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  products: {
    productId: mongoose.Types.ObjectId;
    title: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  totalPrice: number;
  address: string;
  phone: string;
  status: 'Pending' | 'Delivered' | 'Cancelled';
  whatsappLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        title: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        image: { type: String }
      }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    whatsappLink: { type: String }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);