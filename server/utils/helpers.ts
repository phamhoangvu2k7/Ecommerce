import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using credentials from env
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "Root",
  api_key: process.env.CLOUD_KEY || "",
  api_secret: process.env.CLOUD_SECRET || ""
});

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export function escapeRegex(text: string): string {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function sendMail(to: string, subject: string, htmlContent: string) {
  const mailUser = process.env.EMAIL_USER || process.env.MAIL_USER || "test@example.com";
  const mailPass = process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || "password123";

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email", // Default host for testing if Gmail is not set up
    port: 587,
    secure: false,
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });

  // If gmail user/pass is configured, use gmail service
  if (mailUser.includes("gmail.com")) {
    (transporter as any).options = {
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass
      }
    };
  }

  const mailOptions = {
    from: `"Product Management" <${mailUser}>`,
    to,
    subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = "products"): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    ).end(fileBuffer);
  });
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
