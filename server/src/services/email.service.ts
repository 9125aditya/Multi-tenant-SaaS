import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom = process.env.EMAIL_FROM;

if (!emailFrom) {
  throw new Error("EMAIL_FROM is not configured");
}

export const sendVerificationEmail = async (
  email: string,
  verificationUrl: string
) => {
  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>

      <p>
        Thanks for registering. Please verify your email address
        by clicking the button below.
      </p>

      <p>
        <a
          href="${verificationUrl}"
          style="
            display:inline-block;
            padding:10px 16px;
            background:#000;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Verify Email
        </a>
      </p>

      <p>
        This link will expire in 24 hours.
      </p>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password reset</h2>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:10px 16px;
            background:#000;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This link will expire in 1 hour.
      </p>

      <p>
        If you did not request this, you can safely ignore this email.
      </p>
    `,
  });
};