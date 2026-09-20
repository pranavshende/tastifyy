export const sendOTP = async (phone: string, otp: string, messageTemplate?: string): Promise<boolean> => {
  const authKey = process.env.BLACKSMS_AUTH_KEY;
  const dltTemplateId = process.env.BLACKSMS_OTP_TEMPLATE_ID;

  // To avoid crashing if env variables are empty or missing during dev
  if (!authKey) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking OTP send. Phone: ${phone}, OTP: ${otp}`);
    return true;
  }

  try {
    const message = messageTemplate
      ? messageTemplate.replace('{{otp}}', otp)
      : `Your Tastifyy OTP is ${otp}. Please use this to verify your account.`;

    // Strip leading + from phone if present — API expects 91XXXXXXXXXX format
    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;

    const payload: Record<string, string> = {
      mobile,
      message,
    };

    if (dltTemplateId) {
      payload.dlt_template_id = dltTemplateId;
    }

    const response = await fetch('https://blacksms.in/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[SMS Service] BlackSMS raw response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send SMS via BlackSMS`);
      return false;
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Some providers return plain text success
      console.log(`[SMS Service] OTP sent to ${phone} (non-JSON response)`);
      return true;
    }

    if (data.status === 'success' || data.success === true || data.code === 200) {
      console.log(`[SMS Service] OTP successfully sent to ${phone}`);
      return true;
    } else {
      console.error('[SMS Service] BlackSMS API rejected request:', data);
      return false;
    }
  } catch (error) {
    console.error('[SMS Service] Network or parsing error when contacting BlackSMS:', error);
    return false;
  }
};

export const sendDeliveryOTP = async (phone: string, otp: string): Promise<boolean> => {
  const authKey = process.env.BLACKSMS_AUTH_KEY;
  const dltTemplateId = process.env.BLACKSMS_DELIVERY_TEMPLATE_ID;

  if (!authKey) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking delivery OTP send. Phone: ${phone}, OTP: ${otp}`);
    return true;
  }

  try {
    const message = `Your Tastifyy delivery OTP is ${otp}. Please share this with your delivery partner to receive your order.`;

    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;

    const payload: Record<string, string> = {
      mobile,
      message,
    };

    if (dltTemplateId) {
      payload.dlt_template_id = dltTemplateId;
    }

    const response = await fetch('https://blacksms.in/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[SMS Service] BlackSMS raw response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send delivery SMS via BlackSMS`);
      return false;
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log(`[SMS Service] Delivery OTP sent to ${phone} (non-JSON response)`);
      return true;
    }

    if (data.status === 'success' || data.success === true || data.code === 200) {
      console.log(`[SMS Service] Delivery OTP successfully sent to ${phone}`);
      return true;
    } else {
      console.error('[SMS Service] BlackSMS API rejected delivery OTP request:', data);
      return false;
    }
  } catch (error) {
    console.error('[SMS Service] Network or parsing error when contacting BlackSMS (delivery):', error);
    return false;
  }
};
