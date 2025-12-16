const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v5: uuidv5 } = require('uuid');

// Namespace UUID para gerar UUIDs determinísticos
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id,
      role: user.role || 'user',
      email: user.email
    },
    process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ja esta cadastrado'
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado com sucesso',
      data: { user: user.toPublicJSON(), token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuario',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais invalidas'
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais invalidas'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: { user: user.toPublicJSON(), token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado'
      });
    }
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuario',
      error: error.message
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado'
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email ja esta em uso'
        });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

exports.getSupabaseToken = async (req, res) => {
  try {
    // Validar configuração do Supabase
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!supabaseJwtSecret) {
      console.error('SUPABASE_JWT_SECRET não configurado');
      console.error('Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('JWT')));
      return res.status(500).json({
        success: false,
        message: 'Configuracao do Supabase nao encontrada. Verifique SUPABASE_JWT_SECRET',
        error: 'SUPABASE_JWT_SECRET não está definido nas variáveis de ambiente. Reinicie o servidor após adicionar a variável.'
      });
    }

    // Obter informações do usuário autenticado
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario nao autenticado'
      });
    }

    const userId = user._id ? user._id.toString() : null;
    const userEmail = user.email;

    if (!userId || !userEmail) {
      console.error('Informações do usuário incompletas:', { userId, userEmail, user });
      return res.status(400).json({
        success: false,
        message: 'Informacoes do usuario incompletas',
        error: `Faltando: ${!userId ? 'userId' : ''} ${!userEmail ? 'email' : ''}`
      });
    }

    // Gerar UUID determinístico a partir do ID do usuário
    // O Supabase requer que o campo 'sub' seja um UUID válido
    const userUuid = uuidv5(userId.toString(), NAMESPACE);

    // Gerar token JWT do Supabase
    // O token deve seguir a estrutura do Supabase Auth
    const payload = {
      aud: 'authenticated',           // Audience
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expira em 1 hora
      sub: userUuid,                  // Subject (UUID do usuário - requerido pelo Supabase)
      email: userEmail,               // Email do usuário
      role: 'authenticated',          // Role
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: user.name || '',
        role: user.role || 'user',
        original_user_id: userId.toString() // Manter o ID original do MongoDB
      },
      iat: Math.floor(Date.now() / 1000) // Issued at
    };

    // Gerar o token JWT usando o JWT Secret do Supabase
    let supabaseToken;
    try {
      supabaseToken = jwt.sign(payload, supabaseJwtSecret, {
        algorithm: 'HS256'
      });
    } catch (jwtError) {
      console.error('Erro ao assinar JWT:', jwtError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar token JWT',
        error: jwtError.message
      });
    }

    // Retornar o token
    res.json({
      success: true,
      supabaseToken
    });

  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar token do Supabase',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
    });
  }
};
