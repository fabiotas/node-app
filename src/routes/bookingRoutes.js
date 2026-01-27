const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/auth');
const { 
  createBookingValidation, 
  updateBookingStatusValidation,
  createExternalBookingValidation
} = require('../middlewares/validators');

// Todas as rotas sao protegidas
router.use(protect);

// Rotas de listagem
router.get('/my', bookingController.getMyBookings);
router.get('/owner', bookingController.getBookingsForMyAreas);
router.get('/area/:areaId', bookingController.getBookingsByArea);

// CRUD
router.get('/:id', bookingController.getBookingById);
router.post('/', createBookingValidation, bookingController.createBooking);
router.post('/external', createExternalBookingValidation, bookingController.createExternalBooking);

// Acoes de status
router.patch('/:id/status', updateBookingStatusValidation, bookingController.updateBookingStatus);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;

