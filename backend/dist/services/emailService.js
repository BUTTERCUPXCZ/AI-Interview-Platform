import sgMail from "@sendgrid/mail";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com";
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}
else {
    console.warn("SENDGRID_API_KEY is not set — emails will not be sent");
}
export const sendVerificationEmail = async (to, verificationUrl) => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: "Verify your email",
        text: `Please verify your email by clicking this link: ${verificationUrl}`,
        html: `<p>Please verify your email by clicking this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    };
    if (!SENDGRID_API_KEY)
        return;
    try {
        await sgMail.send(msg);
        return true;
    }
    catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
    }
};
export const sendOtpEmail = async (to, otp) => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: "Your password reset code",
        text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your password reset code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    };
    if (!SENDGRID_API_KEY)
        return;
    try {
        await sgMail.send(msg);
        return true;
    }
    catch (error) {
        console.error("Failed to send OTP email:", error);
        throw error;
    }
};
export default {
    sendVerificationEmail,
    sendOtpEmail,
};
