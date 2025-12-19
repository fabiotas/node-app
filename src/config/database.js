const mongoose = require('mongoose');
const seedAdmin = require('./seedAdmin');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/node-user-api';
    console.log('=== Debug MONGODB_URI ===');
    console.log('URI sendo usada:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Ocultar credenciais no log
    console.log('=========================');
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Criar admin inicial após conectar ao banco
    await seedAdmin();
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
