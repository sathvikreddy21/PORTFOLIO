import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getSmtpConfig(email: string) {
  if (email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')) {
    return { host: 'smtp.gmail.com', port: 465, secure: true };
  }
  if (email.endsWith('@hotmail.com') || email.endsWith('@outlook.com') || email.endsWith('@live.com')) {
    return { host: 'smtp-mail.outlook.com', port: 587, secure: false };
  }
  return { host: 'smtp.gmail.com', port: 465, secure: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    // EMAIL_RECIPIENT is where you want to receive messages (defaults to EMAIL_USER)
    const recipient = process.env.EMAIL_RECIPIENT || user;

    if (!user || !pass) {
      console.error('EMAIL_USER or EMAIL_PASS environment variables are not set');
      return NextResponse.json(
        { error: 'Email server is not configured. Please contact me directly.' },
        { status: 500 }
      );
    }

    const smtpConfig = getSmtpConfig(user);
    const transporter = nodemailer.createTransport({
      ...smtpConfig,
      auth: { user, pass },
    });

    // Email to portfolio owner
    await transporter.sendMail({
      from: `"Portfolio Contact" <${user}>`,
      to: recipient,
      replyTo: email,
      subject: `New Message from Portfolio: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">New Portfolio Message</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          <div style="background-color: #fff; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; color: #555;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">Sent from your portfolio website</p>
        </div>
      `,
    });

    // Confirmation email to the visitor
    await transporter.sendMail({
      from: `"Sathvik Reddy" <${user}>`,
      to: email,
      subject: 'Thanks for reaching out!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Hi ${name},</h2>
          <p style="color: #555; line-height: 1.6;">
            Thanks for getting in touch! I received your message and will get back to you as soon as possible, usually within 1–2 business days.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0; color: #555; font-style: italic;">"${message}"</p>
          </div>
          <p style="color: #555;">Best regards,<br/><strong>Sathvik Reddy Gutha</strong></p>
          <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">This is an automated confirmation. Please do not reply to this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again or contact me directly.' },
      { status: 500 }
    );
  }
}
