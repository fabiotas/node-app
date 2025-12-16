require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Debug: Verificar variáveis de ambiente
console.log('=== Variáveis de Ambiente ===');
console.log('SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
console.log('Todas as variáveis SUPABASE/JWT:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('JWT')));
console.log('=============================');

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API esta funcionando!' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
