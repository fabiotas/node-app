const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, 'Area e obrigatoria']
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Hospede e obrigatorio']
  },
  checkIn: {
    type: Date,
    required: [true, 'Data de check-in e obrigatoria']
  },
  checkOut: {
    type: Date,
    required: [true, 'Data de check-out e obrigatoria']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Preco total e obrigatorio'],
    min: [0, 'Preco nao pode ser negativo']
  },
  guests: {
    type: Number,
    required: [true, 'Numero de hospedes e obrigatorio'],
    min: [1, 'Deve ter pelo menos 1 hospede']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index para buscas eficientes
bookingSchema.index({ area: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });

// Validacao: check-out deve ser depois do check-in
bookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) {
    const error = new Error('Data de check-out deve ser posterior ao check-in');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Método para verificar se há conflito de datas
bookingSchema.statics.hasConflict = async function(areaId, checkIn, checkOut, excludeBookingId = null) {
  const query = {
    area: areaId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      // Nova reserva começa durante uma existente
      { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
      // Nova reserva termina durante uma existente
      { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
      // Nova reserva engloba uma existente
      { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await this.findOne(query);
  return !!conflictingBooking;
};

// Método para calcular número de noites
bookingSchema.methods.getNights = function() {
  const diffTime = Math.abs(this.checkOut - this.checkIn);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

bookingSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    area: this.area,
    guest: this.guest,
    checkIn: this.checkIn,
    checkOut: this.checkOut,
    totalPrice: this.totalPrice,
    guests: this.guests,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Booking', bookingSchema);

