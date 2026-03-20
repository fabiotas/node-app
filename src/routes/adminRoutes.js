const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const userController = require('../controllers/userController');
const areaController = require('../controllers/areaController');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', userController.getAllUsers);
router.patch('/users/:id/approve', userController.approveUser);
router.patch('/users/:id/reject', userController.rejectUser);
router.patch('/users/:id/block', userController.blockUser);

router.get('/areas', areaController.getAllAreasAdmin);
router.patch('/areas/:id/approve', areaController.approveArea);
router.patch('/areas/:id/reject', areaController.rejectArea);

module.exports = router;
