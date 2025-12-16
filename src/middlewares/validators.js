const { body } = require('express-validator');

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email e obrigatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha deve ter no minimo 6 caracteres')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email e obrigatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha e obrigatoria')
];

exports.createUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email e obrigatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Senha deve ter no minimo 6 caracteres'),
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role invalida')
];

exports.updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role invalida'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active deve ser um valor booleano')
];

exports.updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail()
];

exports.updatePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Senha atual e obrigatoria'),
  body('newPassword')
    .notEmpty().withMessage('Nova senha e obrigatoria')
    .isLength({ min: 6 }).withMessage('Nova senha deve ter no minimo 6 caracteres')
];

// Area Validations
exports.createAreaValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome da area e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .trim()
    .notEmpty().withMessage('Descricao e obrigatoria')
    .isLength({ max: 1000 }).withMessage('Descricao deve ter no maximo 1000 caracteres'),
  body('address')
    .trim()
    .notEmpty().withMessage('Endereco e obrigatorio')
    .isLength({ max: 200 }).withMessage('Endereco deve ter no maximo 200 caracteres'),
  body('pricePerDay')
    .notEmpty().withMessage('Preco por dia e obrigatorio')
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),
  body('maxGuests')
    .notEmpty().withMessage('Numero maximo de hospedes e obrigatorio')
    .isInt({ min: 1 }).withMessage('Deve permitir pelo menos 1 hospede'),
  body('amenities')
    .optional()
    .isArray().withMessage('Comodidades devem ser um array'),
  body('images')
    .optional()
    .isArray().withMessage('Imagens devem ser um array')
];

exports.updateAreaValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Descricao deve ter no maximo 1000 caracteres'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Endereco deve ter no maximo 200 caracteres'),
  body('pricePerDay')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco deve ser um numero positivo'),
  body('maxGuests')
    .optional()
    .isInt({ min: 1 }).withMessage('Deve permitir pelo menos 1 hospede'),
  body('amenities')
    .optional()
    .isArray().withMessage('Comodidades devem ser um array'),
  body('images')
    .optional()
    .isArray().withMessage('Imagens devem ser um array'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active deve ser um valor booleano')
];

// Booking Validations
exports.createBookingValidation = [
  body('areaId')
    .notEmpty().withMessage('ID da area e obrigatorio')
    .isMongoId().withMessage('ID da area invalido'),
  body('checkIn')
    .notEmpty().withMessage('Data de check-in e obrigatoria')
    .isISO8601().withMessage('Data de check-in invalida'),
  body('checkOut')
    .notEmpty().withMessage('Data de check-out e obrigatoria')
    .isISO8601().withMessage('Data de check-out invalida'),
  body('guests')
    .notEmpty().withMessage('Numero de hospedes e obrigatorio')
    .isInt({ min: 1 }).withMessage('Deve ter pelo menos 1 hospede')
];

exports.updateBookingStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status e obrigatorio')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Status invalido')
];
