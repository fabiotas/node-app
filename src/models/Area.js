const mongoose = require('mongoose');

// Schema para FAQs
const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Pergunta deve ter no maximo 500 caracteres']
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Resposta deve ter no maximo 2000 caracteres']
  }
}, { _id: true, timestamps: false });

// Schema para preços especiais
const specialPriceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['date_range', 'day_of_week', 'holiday'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  active: {
    type: Boolean,
    default: true
  },
  // Para date_range
  startDate: String,
  endDate: String,
  isPackage: {
    type: Boolean,
    default: false
  },
  // Para day_of_week
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  // Para holiday
  holidayDate: String
}, { _id: true, timestamps: false });

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da area e obrigatorio'],
    trim: true,
    minlength: [2, 'Nome deve ter no minimo 2 caracteres'],
    maxlength: [100, 'Nome deve ter no maximo 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Descricao e obrigatoria'],
    trim: true,
    maxlength: [1000, 'Descricao deve ter no maximo 1000 caracteres']
  },
  address: {
    type: String,
    required: [true, 'Endereco e obrigatorio'],
    trim: true,
    maxlength: [200, 'Endereco deve ter no maximo 200 caracteres']
  },
  bairro: {
    type: String,
    trim: true,
    maxlength: [100, 'Bairro deve ter no maximo 100 caracteres']
  },
  nomeCidade: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome da cidade deve ter no maximo 100 caracteres']
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Preco por dia e obrigatorio'],
    min: [0, 'Preco nao pode ser negativo']
  },
  maxGuests: {
    type: Number,
    required: [true, 'Numero maximo de hospedes e obrigatorio'],
    min: [1, 'Deve permitir pelo menos 1 hospede'],
    default: 1
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  shareImageIndex: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        // Se não houver imagens, o índice deve ser 0
        if (!this.images || this.images.length === 0) {
          return value === 0 || value === undefined;
        }
        // O índice deve ser válido para o array de imagens
        return value >= 0 && value < this.images.length;
      },
      message: 'shareImageIndex deve ser um índice válido do array images'
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proprietario e obrigatorio']
  },
  whatsapp: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // Permite string vazia ou formato de telefone (apenas números, com ou sem caracteres especiais)
        if (!value) return true;
        // Remove caracteres não numéricos para validação
        const phoneNumber = value.replace(/\D/g, '');
        // Valida se tem entre 10 e 15 dígitos (formato internacional)
        return phoneNumber.length >= 10 && phoneNumber.length <= 15;
      },
      message: 'WhatsApp deve conter um número de telefone válido'
    }
  },
  showWhatsapp: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  specialPrices: [specialPriceSchema],
  faqs: [faqSchema]
}, {
  timestamps: true
});

// Index para buscas eficientes
areaSchema.index({ owner: 1 });
areaSchema.index({ active: 1 });
areaSchema.index({ name: 'text', description: 'text', address: 'text', bairro: 'text', nomeCidade: 'text' });

areaSchema.methods.toJSON = function() {
  const obj = this.toObject();
  const images = obj.images || [];
  const shareImageIndex = obj.shareImageIndex !== undefined ? obj.shareImageIndex : 0;
  
  // Garantir que o índice seja válido
  const validShareImageIndex = (shareImageIndex >= 0 && shareImageIndex < images.length) 
    ? shareImageIndex 
    : (images.length > 0 ? 0 : null);
  
  const result = {
    _id: obj._id,
    name: obj.name,
    description: obj.description,
    address: obj.address,
    bairro: obj.bairro !== undefined ? obj.bairro : null,
    nomeCidade: obj.nomeCidade !== undefined ? obj.nomeCidade : null,
    pricePerDay: obj.pricePerDay,
    specialPrices: obj.specialPrices || [],
    maxGuests: obj.maxGuests,
    amenities: obj.amenities || [],
    images: images,
    shareImageIndex: validShareImageIndex,
    shareImage: validShareImageIndex !== null ? images[validShareImageIndex] : null, // URL da imagem de compartilhamento
    owner: obj.owner,
    showWhatsapp: obj.showWhatsapp !== undefined ? obj.showWhatsapp : false,
    faqs: obj.faqs || [],
    active: obj.active,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };

  // Só inclui WhatsApp se showWhatsapp for true
  if (result.showWhatsapp && obj.whatsapp) {
    result.whatsapp = obj.whatsapp;
  }

  return result;
};

module.exports = mongoose.model('Area', areaSchema);

