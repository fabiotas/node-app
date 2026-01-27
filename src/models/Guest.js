const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome e obrigatorio'],
    trim: true,
    minlength: [2, 'Nome deve ter no minimo 2 caracteres'],
    maxlength: [100, 'Nome deve ter no maximo 100 caracteres']
  },
  phone: {
    type: String,
    required: [true, 'Celular e obrigatorio'],
    trim: true,
    match: [/^[\d\s\(\)\-\+]+$/, 'Formato de celular invalido']
  },
  cpf: {
    type: String,
    trim: true,
    sparse: true, // Permite múltiplos documentos sem CPF, mas garante unicidade quando presente
    validate: {
      validator: function(v) {
        if (!v) return true; // CPF é opcional
        // Remove caracteres não numéricos
        const cpf = v.replace(/\D/g, '');
        // Valida se tem 11 dígitos
        return cpf.length === 11;
      },
      message: 'CPF deve conter 11 digitos'
    }
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Data de nascimento é opcional
        // Verifica se a data não é no futuro
        return v <= new Date();
      },
      message: 'Data de nascimento nao pode ser no futuro'
    }
  }
}, {
  timestamps: true
});

// Índice para busca eficiente
guestSchema.index({ phone: 1 });
guestSchema.index({ cpf: 1 }, { sparse: true });

guestSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    phone: this.phone,
    cpf: this.cpf || null,
    birthDate: this.birthDate || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Guest', guestSchema);
