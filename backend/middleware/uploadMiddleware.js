const multer = require('multer');
const fs = require('fs');
const path = require('path');

const resumeUploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(resumeUploadDir, { recursive: true });
fs.mkdirSync(profileUploadDir, { recursive: true });

// Configure storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profilePicture') {
      cb(null, profileUploadDir);
      return;
    }

    cb(null, resumeUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp instead of using email
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'profilePicture' ? 'profile' : 'resume';
    cb(
      null,
      `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profilePicture') {
    const imageTypes = /jpg|jpeg|png|webp/;
    const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb(new Error('Only JPG, PNG, or WEBP profile pictures are allowed.'), false);
    return;
  }

  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error('Only PDF files are allowed!'), false);
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

const getUploadedFile = (req, fieldName) => {
  if (req.files?.[fieldName]?.[0]) {
    return req.files[fieldName][0];
  }

  if (req.file?.fieldname === fieldName) {
    return req.file;
  }

  return null;
};

module.exports = { upload, resumeUploadDir, profileUploadDir, getUploadedFile };
