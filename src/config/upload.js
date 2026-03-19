const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Diretório base de uploads (VPS: use volume persistente)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024; // 5MB default

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = req.query.folder === 'avatar' ? 'avatars' : 'areas';
    const dir = path.join(UPLOAD_DIR, subdir);
    const fs = require('fs');
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const ext = (ALLOWED_EXT.find(e => file.originalname.toLowerCase().endsWith(e)) || path.extname(file.originalname) || '.jpg').toLowerCase();
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Aceita um arquivo em "file" ou vários em "files" (até 20)
const uploadImages = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 20 }
]);

module.exports = {
  upload,
  uploadImages,
  UPLOAD_DIR,
  ALLOWED_MIMES,
  ALLOWED_EXT,
  MAX_FILE_SIZE
};
