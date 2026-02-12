import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import { orderSchema } from "../utils/validators";
import { generateWhatsAppOrderLink } from "../services/whatsappService";
import { Admin } from '../models/Admin';
import { sendOrderNotification } from '../services/fcmService';



export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const { products, totalPrice, address, phone } = value;

    // Validate products
    for (const item of products) {
      // Skip validation if productId is not provided (edge case)
      if (!item.productId) continue;

      const product = await Product.findById(item.productId).catch(() => null);

      if (!product) {
        console.log(
          `⚠️ Product not found: ${item.productId}, Title: ${item.title}`,
        );
        // Don't throw error, just skip stock validation for this product
        continue;
      }

      if (product.status === "Out of Stock") {
        throw new ApiError(400, `Product ${product.title} is out of stock`);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.title}. Available: ${product.stock}`,
        );
      }
    }

    const order = await Order.create({
      userId: req.user!._id,
      products,
      totalPrice,
      address,
      phone,
      status: "Pending",
    });

    const whatsappLink = generateWhatsAppOrderLink({
      products: products.map((p: any) => ({
        title: p.title,
        size: p.size,
        quantity: p.quantity,
        price: p.price,
      })),
      totalPrice,
      customerName: req.user!.name,
      address,
      phone,
    });

    order.whatsappLink = whatsappLink;
    await order.save();

    for (const item of products) {
      if (!item.productId) continue;

      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      }).catch((err) => {
        console.log(
          `⚠️ Could not update stock for product ${item.productId}: ${err.message}`,
        );
      });
    }

    // ✨ Send real-time notification to all admins
    // ✨ Send real-time notification to all admins
    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("new:order", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: req.user!.name,
        totalPrice: order.totalPrice,
        itemCount: order.products.length,
        createdAt: order.createdAt,
        message: `New order received from ${req.user!.name}!`,
      });
      console.log("📢 Socket notification sent to admins");
    }

    // ✨ Send FCM push notification to all admins
    try {
      const admins = await Admin.find({ role: "admin" });
      const allTokens = admins.flatMap((admin) => admin.fcmTokens || []);

      if (allTokens.length > 0) {
        await sendOrderNotification(allTokens, {
          orderNumber: order.orderNumber,
          customerName: req.user!.name,
          totalPrice: order.totalPrice,
          orderId: order._id.toString(),
        });
        console.log("📲 FCM notification sent to admins");
      }
    } catch (fcmError: any) {
      console.error("FCM Error:", fcmError.message);
    }

    res.status(201).json({
      success: true,
      order,
      whatsappLink,
    });
  },
);

export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ userId: req.user!._id }),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

export const getAllOrders = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20, status } = req.query;

    const query: any = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

export const getOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id).populate(
      "userId",
      "name email phone",
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (
      order.userId._id.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      throw new ApiError(403, "Not authorized to view this order");
    }

    res.json({
      success: true,
      order,
    });
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;

    if (!["Pending", "Delivered", "Cancelled"].includes(status)) {
      throw new ApiError(
        400,
        "Invalid status. Allowed: Pending, Delivered, Cancelled",
      );
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      order,
    });
  },
);

export const cancelOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "Not authorized to cancel this order");
    }

    // Check if order is already delivered or cancelled
    if (order.status === "Delivered") {
      throw new ApiError(400, "Cannot cancel a delivered order");
    }

    if (order.status === "Cancelled") {
      throw new ApiError(400, "Order is already cancelled");
    }

    // Restore product stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({
      success: true,
      order,
      message: "Order cancelled successfully",
    });
  },
);
