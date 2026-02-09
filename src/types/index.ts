import type { Request } from 'express';
import { IUser } from '../models/User';
import { IAdmin } from '../models/Admin';

export interface AuthRequest extends Request {
  user?: IUser | IAdmin;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ProductFilterQuery extends PaginationQuery {
  category?: string;
  gender?: string;
  season?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  isOffer?: boolean;
  status?: string;
  sort?: string;
}