import { compareSync, hashSync } from 'bcrypt-edge'
import { Resend } from 'resend'
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
  // eslint-disable-next-line node/prefer-global/process
  const apiKey = process.env.RESEND_API_KEY
  // eslint-disable-next-line node/prefer-global/process
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  // Nếu không có API Key, chuyển sang chế độ Mock log ở Console (Hỗ trợ chạy Offline/Local)
  if (!apiKey) {
    console.warn('[Mail Warning] RESEND_API_KEY chưa được cấu hình trong .env. Email sẽ được in ra console.')
    return { id: `mock-id-${Date.now()}` }
  }

  const resend = new Resend(apiKey)

  try {
    const response = await resend.emails.send({
      from: `Product Management <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
    })

    if (response.error) {
      console.error('[Resend Error]', response.error)
      throw new Error(response.error.message)
    }

    return response.data
  }
  catch (err) {
    console.error('[Mail Exception] Lỗi khi gửi email qua Resend:', err)
    throw err
  }
}

// eslint-disable-next-line node/prefer-global/buffer
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

export async function uploadToCloudinary(
  // eslint-disable-next-line node/prefer-global/buffer
  fileBuffer: Buffer,
  folder: string = 'products',
  options?: { contentType?: string, filename?: string },
): Promise<string> {
  let ext = ''
  if (options?.filename) {
    const parts = options.filename.split('.')
    if (parts.length > 1) {
      ext = `.${parts.pop()?.toLowerCase()}`
    }
  }
  if (!ext) {
    ext = getExtension(fileBuffer)
  }

  const filename = `${randomUUID()}${ext}`
  const pathname = `${folder}/${filename}`

  // Save to NuxtHub Blob (Cloudflare R2 in production, local fs in dev)
  await blob.put(pathname, fileBuffer, {
    contentType: options?.contentType,
  })

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
  // eslint-disable-next-line unused-imports/no-unused-vars
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
  // eslint-disable-next-line node/prefer-global/process
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('[Security] JWT_SECRET environment variable is not defined!')
  }
  return secret
}
