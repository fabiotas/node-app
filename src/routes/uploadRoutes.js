const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middlewares/auth');
const { uploadImages } = require('../config/upload');

// Upload de imagens (áreas ou avatar). Requer autenticação.
router.post('/', protect, (req, res, next) => {
  uploadImages(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `Arquivo muito grande. Máximo: ${(process.env.UPLOAD_MAX_FILE_SIZE_MB || 5)}MB`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao enviar arquivo'
      });
    }
    next();
  });
}, uploadController.uploadImage);

module.exports = router;
