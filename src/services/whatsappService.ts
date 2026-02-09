export interface WhatsAppOrderData {
  products: Array<{
    title: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  customerName: string;
  address: string;
  phone: string;
}

export const generateWhatsAppOrderLink = (data: WhatsAppOrderData): string => {
  const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '';

  let message = `🛍️ *New Order Request*\n\n`;
  message += `👤 *Customer:* ${data.customerName}\n`;
  message += `📱 *Phone:* ${data.phone}\n`;
  message += `📍 *Address:* ${data.address}\n\n`;
  message += `📦 *Products:*\n`;

  data.products.forEach((product, index) => {
    message += `${index + 1}. ${product.title}\n`;
    message += `   Size: ${product.size} | Qty: ${product.quantity} | Price: ৳${product.price}\n`;
  });

  message += `\n💰 *Total: ৳${data.totalPrice}*\n\n`;
  message += `Please confirm this order. Thank you!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/${businessNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;

  return whatsappLink;
};