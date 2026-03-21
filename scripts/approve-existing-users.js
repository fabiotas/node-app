require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function run() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI não configurado');
  }

  await mongoose.connect(mongoUri);

  // Aprova automaticamente usuários pendentes/reprovados e mantém bloqueados.
  const result = await User.updateMany(
    { approvalStatus: { $in: ['pending', 'rejected'] } },
    { $set: { approvalStatus: 'approved', active: true } }
  );

  console.log('Usuários atualizados com sucesso.');
  console.log(`matchedCount: ${result.matchedCount}`);
  console.log(`modifiedCount: ${result.modifiedCount}`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Erro ao aprovar usuários existentes:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
