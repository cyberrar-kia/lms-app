import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;

export async function sendApprovalEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're in! Here's how to log in",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been approved. You can now log in and access your course.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background:#6C3DE0;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">Log In Now</a>
      <p style="margin-top:24px;color:#666;">If you have any issues, reply to this email.</p>
    `,
  });
}

export async function sendRejectionEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "About your application",
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for your interest. Unfortunately your application was not approved at this time.</p>
      <p>If you believe this is a mistake, please reply to this email.</p>
    `,
  });
}

export async function sendPaymentConfirmationEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Payment received — welcome aboard!",
    html: `
      <h2>Payment Confirmed! 🎉</h2>
      <p>Hi ${name}, your payment was successful and your account is now active.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background:#6C3DE0;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">Access Your Course</a>
    `,
  });
}

export async function sendNewStudentNotification(studentName: string, studentEmail: string) {
  await resend.emails.send({
    from: FROM,
    to: FROM,
    subject: "New student awaiting approval",
    html: `
      <h2>New Student Registration</h2>
      <p><strong>Name:</strong> ${studentName}</p>
      <p><strong>Email:</strong> ${studentEmail}</p>
      <p>Log in to your creator dashboard to approve or reject this student.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/creator/students" style="background:#6C3DE0;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">Review Student</a>
    `,
  });
}
