#!/usr/bin/env node

/**
 * Script CLI para criar usuários admin adicionais
 * Uso: node scripts/create-admin.js <email> <senha> [nome]
 * 
 * Exemplo:
 *   node scripts/create-admin.js admin@example.com senha123 "Nome do Admin"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/node-user-api'
    );
    console.log(`✓ Conectado ao MongoDB: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`✗ Erro ao conectar ao MongoDB: ${error.message}`);
    return false;
  }
};

const createAdmin = async (email, password, name) => {
  try {
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`⚠ Usuário ${email} já é admin`);
        return false;
      }
      
      // Atualizar para admin
      existingUser.role = 'admin';
      if (name) existingUser.name = name;
      if (password) {
        existingUser.password = password;
      }
      await existingUser.save();
      console.log(`✓ Usuário ${email} atualizado para admin`);
      return true;
    }

    // Criar novo admin
    const admin = await User.create({
      name: name || 'Administrador',
      email,
      password,
      role: 'admin',
      active: true
    });

    console.log(`✓ Admin criado com sucesso!`);
    console.log(`  Email: ${email}`);
    console.log(`  Nome: ${admin.name}`);
    return true;
  } catch (error) {
    console.error(`✗ Erro ao criar admin: ${error.message}`);
    return false;
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Uso: node scripts/create-admin.js <email> <senha> [nome]');
    console.log('');
    console.log('Exemplos:');
    console.log('  node scripts/create-admin.js admin@example.com senha123');
    console.log('  node scripts/create-admin.js admin@example.com senha123 "Nome do Admin"');
    process.exit(1);
  }

  const [email, password, name] = args;

  if (!email || !password) {
    console.error('✗ Email e senha são obrigatórios');
    process.exit(1);
  }

  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  const success = await createAdmin(email, password, name);
  
  await mongoose.connection.close();
  process.exit(success ? 0 : 1);
};

main();

