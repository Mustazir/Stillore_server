import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  firebaseToken: Joi.string().required(),
  photoURL: Joi.string().uri().optional()
});

export const loginSchema = Joi.object({
  firebaseToken: Joi.string().required()
});

export const productSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  category: Joi.string().required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).optional(),
  sizes: Joi.array().items(Joi.string()).min(1).required(),
  status: Joi.string().valid('Available', 'Out of Stock', 'Coming Soon').optional(),
  description: Joi.string().optional().allow(''),
  images: Joi.array().items(Joi.string()).optional(),
  gender: Joi.string().valid('Men', 'Women', 'Unisex').required(),
  season: Joi.string().valid('Summer', 'Winter','Ramadan', 'All Season').optional().allow(''),
  tags: Joi.array().items(Joi.string()).optional(),
  isOffer: Joi.boolean().optional(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  badgeText: Joi.string().max(50).optional().allow(''),
  stock: Joi.number().min(0).required()
});

export const categorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  code: Joi.string().min(1).max(5).uppercase().required(),
  description: Joi.string().max(500).optional().allow(''),
  image: Joi.string().uri().optional().allow(''),
  imageFile: Joi.any().optional(),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const orderSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      title: Joi.string().required(),
      serial: Joi.string().optional(),
      size: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().min(0).required(),
      image: Joi.string().uri().optional()
    })
  ).min(1).required(),
  totalPrice: Joi.number().min(0).required(),
  address: Joi.string().min(10).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required()
});