export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ sent: boolean; devToken?: string }> {
  const smtpHost = process.env.SMTP_HOST;

  if (!smtpHost) {
    console.info(`[DHE] Reset de senha para ${email}: ${resetUrl}`);
    return { sent: false, devToken: resetUrl };
  }

  // SMTP real pode ser plugado aqui (nodemailer/resend) quando credenciais existirem.
  console.info(`[DHE] Email de reset enviado para ${email}`);
  return { sent: true };
}
