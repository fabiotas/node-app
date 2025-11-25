const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { 
  createUserValidation, 
  updateUserValidation, 
  updatePasswordValidation 
} = require('../middlewares/validators');

router.use(protect);

router
  .route('/')
  .get(authorize('admin'), userController.getAllUsers)
  .post(authorize('admin'), createUserValidation, userController.createUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .put(updateUserValidation, userController.updateUser)
  .delete(authorize('admin'), userController.deleteUser);

router
  .route('/:id/password')
  .patch(updatePasswordValidation, userController.updatePassword);

module.exports = router;
