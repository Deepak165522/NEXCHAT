const twilio = require("twilio");

// Correct Twilio credentials from .env
const accountSid = process.env.TWILLO_ACCOUNT_SID;
  // Must start with AC
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid =process.env.TWILLO_SERVICE_SID;  // Twilio Verify Service SID (starts with VA)

if (!accountSid || !authToken || !serviceSid) {
  throw new Error("Twilio environment variables are missing or incorrect");
}

const client = twilio(accountSid, authToken);

// -----------------------------
// Send OTP to phone
// -----------------------------
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    console.log("Sending OTP to:", phoneNumber);

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log("OTP send response:", response);
    return response;
  } catch (error) {
    console.error("Failed to send OTP:", error.message);
    throw new Error("Failed to send OTP");
  }
};

// -----------------------------
// Verify OTP
// -----------------------------
const verifyOtp = async (phoneNumber, otp) => {
  try {
    

    console.log("Verifying OTP for:", phoneNumber, "OTP:", otp);

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log("OTP verification response:", response);
    return response;
  } catch (error) {
    console.error("OTP verification failed:", error);
    throw new Error("Failed to verify OTP");
  }
};

module.exports = {
  sendOtpToPhoneNumber,
  verifyOtp,
};
