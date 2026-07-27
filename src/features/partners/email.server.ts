import 'server-only'
import nodemailer from 'nodemailer'
import { getServerEnv } from '@/config/env.server'

export async function sendPartnerCredentials(input: {
  to: string
  partnerName: string
  username: string
  password: string
}) {
  const env = getServerEnv()
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error('Partner approved, but email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD, then send the credentials again.')
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: env.EMAIL_FROM || `"Mygreat" <${env.GMAIL_USER}>`,
    to: input.to,
    subject: 'Your Mygreat partner account is approved',
    text: [
      `Hello ${input.partnerName},`,
      '',
      'Your study abroad company has been approved on Mygreat.',
      'Role: PARTNER_ADMIN',
      `Username: ${input.username}`,
      `Temporary password: ${input.password}`,
      '',
      `Sign in: ${env.PUBLIC_APP_URL}/login/partner`,
      'Please change the temporary password immediately after signing in.',
    ].join('\n'),
  })
}
