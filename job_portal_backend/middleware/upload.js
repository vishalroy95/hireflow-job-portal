const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = file.fieldname === 'profileImage'
      ? 'profile-images'
      : file.fieldname === 'companyLogo'
        ? 'company-logos'
        : 'resumes';
    const destination = path.join(__dirname, '..', 'uploads', folder);
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, `${req.userId}-${Date.now()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return cb(null, allowed.includes(file.mimetype));
  }

  if (['profileImage', 'companyLogo'].includes(file.fieldname)) {
    return cb(null, file.mimetype.startsWith('image/'));
  }

  return cb(null, false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
