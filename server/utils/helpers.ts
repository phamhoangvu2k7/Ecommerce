import bcrypt from 'bcryptjs'
import { blob } from 'hub:blob'
import nodemailer from 'nodemailer'
import { randomUUID } from 'uncrypto'

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

export function escapeRegex(text: string): string {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export async function sendMail(to: string, subject: string, htmlContent: string) {
  const mailUser = process.env.EMAIL_USER || process.env.MAIL_USER || 'test@example.com'
  const mailPass = process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || 'password123'

  let transporterOptions: any = {
    host: 'smtp.ethereal.email', // Default host for testing if Gmail is not set up
    port: 587,
    secure: false,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  }

  // If gmail user/pass is configured, use gmail service
  if (mailUser.includes('gmail.com')) {
    transporterOptions = {
      service: 'gmail',
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    }
  }

  try {
    const transporter = nodemailer.createTransport(transporterOptions)
    const mailOptions = {
      from: `"Product Management" <${mailUser}>`,
      to,
      subject,
      html: htmlContent,
    }
    return await transporter.sendMail(mailOptions)
  }
  catch (err: any) {
    // If it's a Gmail authentication error or failure, fallback to Ethereal test account dynamically
    if (mailUser.includes('gmail.com')) {
      console.warn('[Mail] Gmail authentication failed (likely needs Google App Password). Falling back to dynamic ethereal.email test account...')
      try {
        const testAccount = await nodemailer.createTestAccount()
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })

        const mailOptions = {
          from: `"Product Management (Fallback)" <${testAccount.user}>`,
          to,
          subject,
          html: htmlContent,
        }

        const result = await fallbackTransporter.sendMail(mailOptions)

        // Print the OTP details clearly to the server console
        console.log(`\n==================================================`)
        console.log(`[OTP FALLBACK PREVIEW] To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(`Content Preview:`)
        console.log(htmlContent.replace(/<[^>]*>/g, '').trim()) // Strip HTML tags to show text OTP
        console.log(`Ethereal Preview URL: ${nodemailer.getTestMessageUrl(result)}`)
        console.log(`==================================================\n`)

        return result
      }
      catch (fallbackErr) {
        console.error('[Mail] Fallback email sending failed:', fallbackErr)
      }
    }
    throw err
  }
}

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'products'): Promise<string> {
  const filename = `${folder}/${randomUUID()}.jpg`
  const blobFile = await blob.put(filename, fileBuffer, {
    addRandomSuffix: true,
  })
  return blobFile.url
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function stripImageDomain(url: string | undefined | null): string {
  if (!url)
    return ''
  let path = url
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url)
      path = parsed.pathname
    }
  }
  catch (e) {}

  if (path.startsWith('/blobs/')) {
    return path.substring(7)
  }
  if (path.startsWith('blobs/')) {
    return path.substring(6)
  }
  if (path.startsWith('/')) {
    return path.substring(1)
  }
  return path
}

export function prependImageDomain(path: string | undefined | null): string {
  if (!path)
    return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('/blobs/') || path.startsWith('blobs/')) {
    return path.startsWith('/') ? path : `/${path}`
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  return `/blobs/${cleanPath}`
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('[Security] JWT_SECRET environment variable is not defined!')
  }
  return secret
}
