const mongoose = require('mongoose');

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
  active: {
    type: Boolean,
    default: true
  },
  specialPrices: [specialPriceSchema]
}, {
  timestamps: true
});

// Index para buscas eficientes
areaSchema.index({ owner: 1 });
areaSchema.index({ active: 1 });
areaSchema.index({ name: 'text', description: 'text', address: 'text' });

areaSchema.methods.toJSON = function() {
  const obj = this.toObject();
  const images = obj.images || [];
  const shareImageIndex = obj.shareImageIndex !== undefined ? obj.shareImageIndex : 0;
  
  // Garantir que o índice seja válido
  const validShareImageIndex = (shareImageIndex >= 0 && shareImageIndex < images.length) 
    ? shareImageIndex 
    : (images.length > 0 ? 0 : null);
  
  return {
    _id: obj._id,
    name: obj.name,
    description: obj.description,
    address: obj.address,
    pricePerDay: obj.pricePerDay,
    specialPrices: obj.specialPrices || [],
    maxGuests: obj.maxGuests,
    amenities: obj.amenities || [],
    images: images,
    shareImageIndex: validShareImageIndex,
    shareImage: validShareImageIndex !== null ? images[validShareImageIndex] : null, // URL da imagem de compartilhamento
    owner: obj.owner,
    active: obj.active,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

module.exports = mongoose.model('Area', areaSchema);

