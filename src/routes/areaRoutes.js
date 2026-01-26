const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { protect } = require('../middlewares/auth');
const { 
  createAreaValidation, 
  updateAreaValidation 
} = require('../middlewares/validators');

// Rotas publicas
router.get('/', areaController.getAllAreas);

// Rota protegida para obter areas do usuario (deve vir antes de /:id)
router.get('/my', protect, areaController.getMyAreas);

router.get('/:areaId/special-prices', protect, areaController.getSpecialPrices);
router.post('/:areaId/special-prices', protect, areaController.createSpecialPrice);
router.put('/:areaId/special-prices/:priceId', protect, areaController.updateSpecialPrice);
router.delete('/:areaId/special-prices/:priceId', protect, areaController.deleteSpecialPrice);

// Rotas publicas com parametro
router.get('/:id', areaController.getAreaById);
router.get('/:id/availability', areaController.checkAvailability);

// Rotas protegidas de criacao/edicao/exclusao
router.post('/', protect, createAreaValidation, areaController.createArea);
router.put('/:id', protect, updateAreaValidation, areaController.updateArea);
router.delete('/:id', protect, areaController.deleteArea);

module.exports = router;

