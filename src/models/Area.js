const mongoose = require('mongoose');

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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proprietario e obrigatorio']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index para buscas eficientes
areaSchema.index({ owner: 1 });
areaSchema.index({ active: 1 });
areaSchema.index({ name: 'text', description: 'text', address: 'text' });

areaSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    address: this.address,
    pricePerDay: this.pricePerDay,
    maxGuests: this.maxGuests,
    amenities: this.amenities,
    images: this.images,
    owner: this.owner,
    active: this.active,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Area', areaSchema);

