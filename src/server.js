// Carregar .env apenas se as variáveis não estiverem definidas (não sobrescrever variáveis de ambiente)
// Isso garante que variáveis do docker-compose.yml tenham prioridade
require('dotenv').config({ override: false });
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
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
console.log('SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
console.log('Todas as variáveis SUPABASE/JWT:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('JWT')));
console.log('=============================');

connectDB();

// Configuração de CORS
const allowedOrigins = [
  'https://react-frontend-vihi.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL // Permite configurar via variável de ambiente
].filter(Boolean); // Remove valores undefined/null

const corsOptions = {
  origin: function (origin, callback) {
    // Log para debug
    console.log('CORS - Origin recebida:', origin || 'sem origin');
    console.log('CORS - Origens permitidas:', allowedOrigins);

    // Permitir requisições sem origin (ex: Postman, mobile apps, requisições do mesmo servidor)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar se a origin está na lista de permitidas
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Em desenvolvimento, permitir qualquer origin
      if (process.env.NODE_ENV === 'development') {
        console.log('CORS - Permitindo origin em desenvolvimento:', origin);
        callback(null, true);
      } else {
        console.error('CORS bloqueado - Origin não permitida:', origin);
        callback(new Error('Não permitido pelo CORS'));
      }
    }
  },
  credentials: true, // Permite envio de cookies/credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware para tratar requisições OPTIONS (preflight) ANTES de tudo
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const isAllowed = !origin || 
                     allowedOrigins.indexOf(origin) !== -1 || 
                     process.env.NODE_ENV === 'development';
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // Cache por 24 horas
      return res.status(204).end();
    } else {
      // Origin não permitida - retornar 403
      return res.status(403).json({
        success: false,
        message: 'Origem não permitida pelo CORS',
        origin: origin
      });
    }
  }
  next();
});

// Aplicar CORS antes de qualquer outra coisa
app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint - usado para keep-alive e monitoramento
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API esta funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint raiz também responde para facilitar keep-alive
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Node.js está rodando',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      areas: '/api/areas',
      bookings: '/api/bookings'
    }
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  // Se for erro de CORS, retornar resposta adequada
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origem não permitida pelo CORS',
      origin: req.headers.origin
    });
  }

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
