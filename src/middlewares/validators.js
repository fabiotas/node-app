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
