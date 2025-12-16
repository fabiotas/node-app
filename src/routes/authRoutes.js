const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { 
  registerValidation, 
  loginValidation,
  updateProfileValidation 
} = require('../middlewares/validators');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

router.get('/me', protect, authController.getMe);
router.put('/me', protect, updateProfileValidation, authController.updateMe);
router.get('/supabase-token', protect, authController.getSupabaseToken);

module.exports = router;
