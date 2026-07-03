import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./firebase";

export async function sendOTP(phone) {
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }

    const appVerifier = window.recaptchaVerifier;

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      "+91" + phone,
      appVerifier
    );

    window.confirmationResult = confirmationResult;

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: error.message,
    };
  }
}