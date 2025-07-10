const multer = require('multer');
const path = require('path');

// Configure storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp instead of using email
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(
      null,
      `resume-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

module.exports = { upload }; 