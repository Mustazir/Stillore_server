import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Category from '../models/Category';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { period = 'today' } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    if (period === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: startOfYear } };
    }

    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      periodRevenue,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        periodRevenue: periodRevenue[0]?.total || 0,
        period
      },
      recentOrders
    });
  }
);

export const getSalesChart = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { period = 'month' } = req.query;

    let groupBy: any;
    let dateRange: Date;
    const now = new Date();

    if (period === 'week') {
      groupBy = { $dayOfWeek: '$createdAt' };
      dateRange = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      groupBy = { $dayOfMonth: '$createdAt' };
      dateRange = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      groupBy = { $month: '$createdAt' };
      dateRange = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
          status: 'Delivered'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      salesData
    });
  }
);

export const getTopProducts = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const topProducts = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          title: { $first: '$products.title' },
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      topProducts
    });
  }
);