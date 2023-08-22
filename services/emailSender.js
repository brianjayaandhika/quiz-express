import nodemailer from 'nodemailer';

export const emailSender = (data, callback) => {
  const transport = nodemailer.createTransport({
    host: process.env.DB_MAIL_HOST,
    port: process.env.DB_MAIL_PORT,
    auth: {
      user: process.env.DB_MAIL_USER,
      pass: process.env.DB_MAIL_PASS,
    },
  });

  transport.sendMail(data, callback);
};
