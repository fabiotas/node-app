const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso nao autorizado. Token nao fornecido'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario nao encontrado'
        });
      }

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: 'Conta desativada'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalido ou expirado'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro na autenticacao',
      error: error.message
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para acessar este recurso'
      });
    }
    next();
  };
};
