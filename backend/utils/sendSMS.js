const https = require('https');

/**
 * Sends an OTP SMS to the user via Fast2SMS
 * @param {string} phoneNumber - 10 digit Indian phone number (without +91)
 * @param {string} otp - 6 digit OTP code
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  // Remove +91 or 91 prefix if present, keep only 10 digits
  const cleanPhone = phoneNumber.replace(/^(\+91|91)/, '').trim();

  const payload = JSON.stringify({
    route: 'otp',
    variables_values: otp,
    numbers: cleanPhone,
    flash: 0,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true) {
            console.log('✅ SMS sent successfully to', cleanPhone);
            resolve(parsed);
          } else {
            console.error('❌ Fast2SMS error:', parsed);
            reject(new Error(parsed.message || 'SMS sending failed'));
          }
        } catch (e) {
          reject(new Error('Invalid response from Fast2SMS'));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ SMS request error:', e);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { sendOTPSMS };
