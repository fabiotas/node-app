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
    .isBoolean().withMessage('Active deve ser um valor booleano'),
  body('specialPrices')
    .optional()
    .isArray().withMessage('Precos especiais devem ser um array'),
  body('bairro')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bairro deve ter no maximo 100 caracteres'),
  body('nomeCidade')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Nome da cidade deve ter no maximo 100 caracteres'),
  body('whatsapp')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // WhatsApp é opcional
      const phoneNumber = value.replace(/\D/g, '');
      if (phoneNumber.length < 10 || phoneNumber.length > 15) {
        throw new Error('WhatsApp deve conter entre 10 e 15 dígitos');
      }
      return true;
    }),
  body('showWhatsapp')
    .optional()
    .isBoolean().withMessage('showWhatsapp deve ser um valor booleano'),
  body('faqs')
    .optional()
    .isArray().withMessage('FAQs devem ser um array')
    .custom((faqs) => {
      if (!Array.isArray(faqs)) return true;
      for (const faq of faqs) {
        if (!faq.question || !faq.answer) {
          throw new Error('Cada FAQ deve ter question e answer');
        }
        if (faq.question.length > 500) {
          throw new Error('Pergunta deve ter no maximo 500 caracteres');
        }
        if (faq.answer.length > 2000) {
          throw new Error('Resposta deve ter no maximo 2000 caracteres');
        }
      }
      return true;
    })
];

// Função para validar preço especial
function validateSpecialPrice(price) {
  // Validar campos obrigatórios
  if (!price.type) {
    return 'Tipo é obrigatório';
  }

  if (!['date_range', 'day_of_week', 'holiday'].includes(price.type)) {
    return 'Tipo inválido. Deve ser: date_range, day_of_week ou holiday';
  }

  if (!price.name || price.name.trim() === '') {
    return 'Nome é obrigatório';
  }

  if (!price.price || price.price <= 0) {
    return 'Preço deve ser maior que zero';
  }

  // Validações específicas por tipo
  if (price.type === 'date_range') {
    if (!price.startDate || !price.endDate) {
      return 'Data inicial e final são obrigatórias para período especial';
    }

    const start = new Date(price.startDate);
    const end = new Date(price.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Datas inválidas';
    }

    if (start >= end) {
      return 'Data final deve ser posterior à data inicial';
    }

    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(price.startDate) || !dateRegex.test(price.endDate)) {
      return 'Formato de data inválido. Use YYYY-MM-DD';
    }

    // Verificar se não é data retroativa
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) {
      return 'Não é possível criar preços especiais para períodos que já passaram';
    }

    // isPackage é opcional, mas se existir deve ser boolean
    if (price.isPackage !== undefined && typeof price.isPackage !== 'boolean') {
      return 'isPackage deve ser um boolean';
    }
  }

  if (price.type === 'day_of_week') {
    if (!price.daysOfWeek || !Array.isArray(price.daysOfWeek) || price.daysOfWeek.length === 0) {
      return 'Dias da semana são obrigatórios';
    }

    // Validar que são números entre 0 e 6
    for (const day of price.daysOfWeek) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return 'Dias da semana devem ser números entre 0 (domingo) e 6 (sábado)';
      }
    }
  }

  if (price.type === 'holiday') {
    if (!price.holidayDate) {
      return 'Data do feriado é obrigatória';
    }

    // Validar formato MM-DD
    const holidayRegex = /^\d{2}-\d{2}$/;
    if (!holidayRegex.test(price.holidayDate)) {
      return 'Formato de data de feriado inválido. Use MM-DD (ex: 12-25)';
    }

    const [month, day] = price.holidayDate.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return 'Data de feriado inválida';
    }
  }

  // active é opcional, mas se existir deve ser boolean
  if (price.active !== undefined && typeof price.active !== 'boolean') {
    return 'active deve ser um boolean';
  }

  return null; // Sem erros
}

exports.validateSpecialPrice = validateSpecialPrice;

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

// Guest Validations
exports.createGuestValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Celular e obrigatorio')
    .matches(/^[\d\s\(\)\-\+]+$/).withMessage('Formato de celular invalido'),
  body('cpf')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // CPF é opcional
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) {
        throw new Error('CPF deve conter 11 digitos');
      }
      return true;
    }),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('Data de nascimento invalida')
    .custom((value) => {
      if (!value) return true; // Data de nascimento é opcional
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error('Data de nascimento nao pode ser no futuro');
      }
      return true;
    })
];

// External Booking Validations (para dono da área cadastrar reservas externas)
exports.createExternalBookingValidation = [
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
    .isInt({ min: 1 }).withMessage('Deve ter pelo menos 1 hospede'),
  body('guest.name')
    .trim()
    .notEmpty().withMessage('Nome do hospede e obrigatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('guest.phone')
    .trim()
    .notEmpty().withMessage('Celular do hospede e obrigatorio')
    .matches(/^[\d\s\(\)\-\+]+$/).withMessage('Formato de celular invalido'),
  body('guest.cpf')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // CPF é opcional
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) {
        throw new Error('CPF deve conter 11 digitos');
      }
      return true;
    }),
  body('guest.birthDate')
    .optional()
    .isISO8601().withMessage('Data de nascimento invalida')
    .custom((value) => {
      if (!value) return true; // Data de nascimento é opcional
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error('Data de nascimento nao pode ser no futuro');
      }
      return true;
    }),
  body('totalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Preco total deve ser um numero positivo'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Status invalido')
];
