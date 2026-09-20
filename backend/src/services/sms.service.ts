export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  const authKey = process.env.BLACKSMS_AUTH_KEY;
  const senderId = process.env.BLACKSMS_SENDER_ID;

  if (!authKey || !senderId) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking OTP send. Phone: ${phone}, OTP: ${otp}`);
    return true;
  }

  try {
    // BlackSMS requires exactly 10-digit number (no country code)
    let numbers = phone.startsWith('+') ? phone.slice(1) : phone; // remove +
    if (numbers.startsWith('91') && numbers.length === 12) numbers = numbers.slice(2); // remove 91 prefix

    const payload = {
      sender_id: senderId,
      route: '1',
      variables_values: otp,
      numbers
    };

    const response = await fetch('https://blacksms.in/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[SMS Service] BlackSMS response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send OTP via BlackSMS`);
      return false;
    }

    let data: any;
    try { data = JSON.parse(responseText); } catch { return true; }

    if (data.return === true || data.status === 1 || data.status === 'success') {
      console.log(`[SMS Service] OTP successfully sent to ${phone}`);
      return true;
    } else {
      console.error('[SMS Service] BlackSMS rejected request:', data);
      return false;
    }
  } catch (error) {
    console.error('[SMS Service] Network error contacting BlackSMS:', error);
    return false;
  }
};

export const sendDeliveryOTP = async (phone: string, otp: string): Promise<boolean> => {
  const authKey = process.env.BLACKSMS_AUTH_KEY;
  const senderId = process.env.BLACKSMS_SENDER_ID;

  if (!authKey || !senderId) {
    console.warn(`[SMS Service] BlackSMS credentials missing. Mocking delivery OTP. Phone: ${phone}, OTP: ${otp}`);
    return true;
  }

  try {
    // BlackSMS requires exactly 10-digit number (no country code)
    let numbers = phone.startsWith('+') ? phone.slice(1) : phone;
    if (numbers.startsWith('91') && numbers.length === 12) numbers = numbers.slice(2);

    const payload = {
      sender_id: senderId,
      route: '1',
      variables_values: otp,
      numbers
    };

    const response = await fetch('https://blacksms.in/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[SMS Service] BlackSMS delivery response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`[SMS Service] HTTP Error ${response.status}: Failed to send delivery OTP via BlackSMS`);
      return false;
    }

    let data: any;
    try { data = JSON.parse(responseText); } catch { return true; }

    if (data.return === true || data.status === 1 || data.status === 'success') {
      console.log(`[SMS Service] Delivery OTP successfully sent to ${phone}`);
      return true;
    } else {
      console.error('[SMS Service] BlackSMS rejected delivery OTP request:', data);
      return false;
    }
  } catch (error) {
    console.error('[SMS Service] Network error contacting BlackSMS (delivery):', error);
    return false;
  }
};
