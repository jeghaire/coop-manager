import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  void resend.emails.send({
    from: "Cooperative Manager <onboarding@resend.dev>", // works in dev
    to,
    subject,
    html
  });
}
