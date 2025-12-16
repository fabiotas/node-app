const User = require('../models/User');

/**
 * Cria o usuário admin inicial se não existir nenhum admin no sistema
 * Usa variáveis de ambiente para configuração
 */
const seedAdmin = async () => {
  try {
    // Verificar se já existe algum admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✓ Usuário admin já existe no sistema');
      return;
    }

    // Obter credenciais do admin das variáveis de ambiente
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    // Validar se as variáveis estão configuradas
    if (!adminEmail || !adminPassword) {
      console.warn('⚠ Variáveis ADMIN_EMAIL e/ou ADMIN_PASSWORD não configuradas');
      console.warn('⚠ Nenhum usuário admin será criado automaticamente');
      console.warn('⚠ Configure essas variáveis no arquivo .env para criar o admin inicial');
      return;
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`⚠ Email ${adminEmail} já está em uso. Atualizando para admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✓ Usuário atualizado para admin');
      return;
    }

    // Criar o usuário admin
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      active: true
    });

    console.log('✓ Usuário admin criado com sucesso!');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Nome: ${adminName}`);
  } catch (error) {
    console.error('✗ Erro ao criar usuário admin:', error.message);
    // Não interrompe a aplicação se houver erro no seed
  }
};

module.exports = seedAdmin;

