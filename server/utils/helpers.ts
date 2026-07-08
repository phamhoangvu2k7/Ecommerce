import { compareSync, hashSync } from 'bcrypt-edge'
import { randomUUID } from 'uncrypto'

export function hashPassword(password: string): string {
  return hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return compareSync(password, hash)
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
  const mailUser = process.env.EMAIL_USER || 'no-reply@example.com'
  const brevoKey = process.env.BREVO_API_KEY || ''

  console.log(`\n==================================================`)
  console.log(`[MAIL PREVIEW] To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Content Preview:`)
  console.log(htmlContent.replace(/<[^>]*>/g, '').trim()) // Strip HTML tags to show text OTP
  console.log(`==================================================\n`)

  if (brevoKey) {
    try {
      const res = await $fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json'
        },
        body: {
          sender: { name: 'Product Management', email: mailUser },
          to: [{ email: to }],
          subject: subject,
          htmlContent: htmlContent
        }
      })
      return res
    }
    catch (err) {
      console.error('[Mail] Failed to send email via Brevo:', err)
    }
  }

  // Mock mode / Fallback
  return { messageId: 'mock-id-' + Date.now() }
}

function getExtension(buffer: Buffer): string {
  if (buffer.length > 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return '.png'
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return '.jpg'
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return '.gif'
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return '.webp'
    }
  }
  return ''
}

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'products'): Promise<string> {
  const ext = getExtension(fileBuffer)
  const filename = `${randomUUID()}${ext}`
  const pathname = `${folder}/${filename}`

  // Save to NuxtHub Blob (Cloudflare R2 in production, local fs in dev)
  await hubBlob().put(pathname, fileBuffer)

  return pathname
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
