import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ppxxhh111@gmail.com',
    pass: 'bjlz piso qphn vhdi',
  },
});

// async..await is not allowed in global scope, must use a wrapper
export default async function SendMail(payload: { to: string; subject: string; html: string }) {
  try {
    const { to, html, subject } = payload;
    const info = await transporter.sendMail({
      from: '"Xuan Hoang Dev 👻" <ppxxhh111@gmail.com>', // sender address
      to,
      subject,
      html,
    });
    logger.info('Message sent: %s', info.messageId);

    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  } catch (error) {
    logger.error('error', error);
  }
}
