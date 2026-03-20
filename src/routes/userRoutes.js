const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize, authorizeSelfOrAdmin } = require('../middlewares/auth');
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
  .get(authorizeSelfOrAdmin('id'), userController.getUserById)
  .put(authorize('admin'), updateUserValidation, userController.updateUser)
  .delete(authorize('admin'), userController.deleteUser);

router
  .route('/:id/password')
  .patch(authorizeSelfOrAdmin('id'), updatePasswordValidation, userController.updatePassword);

module.exports = router;
