import Product from '../models/Product';
import Category from '../models/Category';
import { ApiError } from '../utils/ApiError';

export const generateProductSerial = async (categoryName: string): Promise<string> => {
  const category = await Category.findOne({ name: categoryName });

  if (!category) {
    throw new ApiError(404, `Category "${categoryName}" not found`);
  }

  const prefix = `STL${category.code}`;

  const lastProduct = await Product.findOne({
    serial: new RegExp(`^${prefix}`)
  }).sort({ serial: -1 });

  let number = 1;

  if (lastProduct) {
    const lastSerial = lastProduct.serial;
    const lastNumber = parseInt(lastSerial.substring(prefix.length));
    number = lastNumber + 1;
  }

  const serial = `${prefix}${number.toString().padStart(5, '0')}`;

  return serial;
};