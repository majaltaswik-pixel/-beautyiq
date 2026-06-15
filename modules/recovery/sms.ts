export interface RecoverySMSTemplate {
  body: string;
  fromNumber: string;
  campaignName: string;
}

export interface SMSConfig {
  fromNumber: string;
  brandName: string;
  provider?: 'twilio' | 'aws-sns';
}

export function buildAbandonedCartSMS(
  customerName: string,
  cartItemsCount: number,
  recoveryUrl: string,
  discountPercent: number,
  config: SMSConfig,
): RecoverySMSTemplate {
  const shortUrl = recoveryUrl;
  const discountCode = `WELCOME${discountPercent}`;

  return {
    body: `Hi ${customerName}! You have ${cartItemsCount} items waiting in your cart at ${config.brandName}. Complete your skincare routine and save ${discountPercent}% with code: ${discountCode}. Shop now: ${shortUrl}`,
    fromNumber: config.fromNumber,
    campaignName: `abandoned_cart_${Date.now()}`,
  };
}

export async function sendSMS(phoneNumber: string, template: RecoverySMSTemplate, config: SMSConfig): Promise<boolean> {
  const apiKey = process.env[`${config.provider?.toUpperCase().replace('-', '_')}_API_KEY`];
  const apiSecret = process.env[`${config.provider?.toUpperCase().replace('-', '_')}_API_SECRET`];

  if (!apiKey || !apiSecret) {
    console.warn('SMS provider not configured. Logging instead.');
    console.log(`[SMS] To: ${phoneNumber}`, template.body);
    return false;
  }

  if (config.provider === 'twilio') {
    const accountSid = apiKey;
    const authToken = apiSecret;
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: template.fromNumber,
        Body: template.body,
      }),
    });
    return resp.ok;
  }

  return false;
}
