import admin from '../config/firebase';
import { Admin } from '../models/Admin';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<void> => {
  if (!tokens || tokens.length === 0) {
    console.log('⚠️ No FCM tokens available');
    return;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('✅ FCM notifications sent:', response.successCount);

    if (response.failureCount > 0) {
      console.log('❌ Failed notifications:', response.failureCount);

      // Remove invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          console.log(`Token ${idx} failed:`, errorCode);

          // Remove invalid/expired tokens
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      // Clean up invalid tokens from database
      if (invalidTokens.length > 0) {
        await Admin.updateMany(
          { fcmTokens: { $in: invalidTokens } },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
        console.log(`🧹 Removed ${invalidTokens.length} invalid tokens`);
      }
    }
  } catch (error: any) {
    console.error('❌ FCM Error:', error.message);
  }
};

export const sendOrderNotification = async (
  tokens: string[],
  orderData: {
    orderNumber: string;
    customerName: string;
    totalPrice: number;
    orderId: string;
  }
): Promise<void> => {
  await sendPushNotification(tokens, {
    title: '🛒 New Order Received!',
    body: `Order #${orderData.orderNumber} from ${orderData.customerName} - ৳${orderData.totalPrice}`,
    data: {
      type: 'new_order',
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      url: '/orders', // ← This will be used in notification click
    },
  });
};