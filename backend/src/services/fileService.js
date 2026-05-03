import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const s3 = new S3Client({ region: process.env.AWS_REGION });
export async function saveUpload(file) {
  if (!file) return null;
  const extension = path.extname(file.originalname || '') || '.jpg';
  const key = `${uuid()}${extension}`;
  if (process.env.USE_S3 === 'true') {
    await s3.send(new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: file.buffer, ContentType: file.mimetype }));
    return `s3://${process.env.AWS_BUCKET_NAME}/${key}`;
  }
  const filePath = path.join(uploadsDir, key);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${key}`;
}
