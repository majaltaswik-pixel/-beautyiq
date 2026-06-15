export interface RecoveryEmailTemplate {
  subject: string;
  previewText: string;
  bodyHtml: string;
  ctaUrl: string;
  ctaText: string;
}

export interface RecoveryEmailConfig {
  fromName: string;
  fromEmail: string;
  shopDomain: string;
  brandName: string;
}

export function buildAbandonedCartEmail(
  customerName: string,
  cartItems: Array<{ title: string; price: number; imageUrl?: string; quantity: number }>,
  cartTotal: number,
  recoveryUrl: string,
  discountPercent: number,
  config: RecoveryEmailConfig,
): RecoveryEmailTemplate {
  const itemsHtml = cartItems.map((item) => {
    const qty = item.quantity || 1;
    return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" width="60" style="border-radius: 4px;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        Qty: ${qty}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * qty).toFixed(2)}
      </td>
    </tr>
  `;
  }).join('');

  const discountCode = `WELCOMEBACK${discountPercent}`;

  return {
    subject: `Complete your ${config.brandName} routine - ${discountPercent}% off`,
    previewText: `You left items in your cart! Here's ${discountPercent}% off to complete your purchase.`,
    bodyHtml: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #f8f0ff 0%, #f0e6ff 100%);">
          <h1 style="color: #6b21a8; margin: 0;">${config.brandName}</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Hi ${customerName},</h2>
          <p>We noticed you left some items in your cart. Your skin is waiting for its perfect routine!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total: $${cartTotal.toFixed(2)}</td>
            </tr>
          </table>
          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">
              Use code: <span style="color: #6b21a8;">${discountCode}</span>
            </p>
            <p style="margin: 5px 0 0; color: #92400e;">Save ${discountPercent}% on your complete routine</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryUrl}" style="background: #6b21a8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Complete My Routine
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>${config.brandName} — Powered by BeautyIQ Revenue System™</p>
          <p><a href="${config.shopDomain}/account" style="color: #6b21a8;">Manage preferences</a></p>
        </div>
      </div>
    `,
    ctaUrl: recoveryUrl,
    ctaText: 'Complete My Routine',
  };
}
