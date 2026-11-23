import nodemailer from 'nodemailer'

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.MAIL_FROM
  )
}

export default async function sendEmail(
  email: string,
  subject: string,
  text: string
) {
  if (!isEmailConfigured()) {
    throw new Error('SMTP settings are required to send email.')
  }

  const port = Number(process.env.SMTP_PORT)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port.')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    text,
  })
}