const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvblrudum';
const apiKey = process.env.CLOUDINARY_API_KEY || '787958224179297';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'ZiwkrOU4sG8WGmB3Yy07miIovUI';

if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Warning: Cloudinary credentials not found in environment variables. Using fallback values. Please add them to your .env file for production.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

module.exports = cloudinary;

