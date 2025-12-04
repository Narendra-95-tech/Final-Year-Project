const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Set up Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'WanderLust',
    allowedFormats: ['jpeg', 'png', 'jpg'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

module.exports = {
  cloudinary,
  storage
};
