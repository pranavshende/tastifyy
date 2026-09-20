export const sendOTP = async (phone: string, otp: string, messageTemplate?: string): Promise<boolean> => {
  const authKey = process.env.BLACKSMS_AUTH_KEY;
  const senderId = process.env.BLACKSMS_SENDER_ID;
  
  // To avoid crashing if env variables are empty or missing during dev
  if (!authKey || !senderId) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking OTP send. Phone: ${phone}, OTP: ${otp}`);
    return true; 
  }

  try {
    const message = messageTemplate 
      ? messageTemplate.replace('{{otp}}', otp)
      : `Your Tastifyy OTP is ${otp}. Please use this to verify your account.`;
    
    const url = 'https://blacksms.in/sms';
    const payload = {
      number: phone,
      type: 'text',
      message: message,
      instance_id: senderId,
      access_token: authKey
    };
    
    const response = await fetch(url, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send SMS via BlackSMS`);
      return false;
    }

    const data = await response.json();
    
    if (data.status === 'success') {
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
  const senderId = process.env.BLACKSMS_SENDER_ID;
  
  // To avoid crashing if env variables are empty or missing during dev
  if (!authKey || !senderId) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking OTP send. Phone: ${phone}, OTP: ${otp}`);
    return true; 
  }

  try {
    const message = `Your Tastifyy delivery OTP is ${otp}. Please share this with your delivery partner to receive your order.`;
    
    const url = 'https://blacksms.in/sms';
    const payload = {
      number: phone,
      type: 'text',
      message: message,
      instance_id: senderId,
      access_token: authKey
    };
    
    const response = await fetch(url, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send SMS via BlackSMS`);
      return false;
    }

    const data = await response.json();
    
    if (data.status === 'success') {
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
