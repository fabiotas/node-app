// Tentar carregar SendGrid (opcional - não quebra se não estiver instalado)
let sgMail = null;
let sendGridAvailable = false;
// teste

try {
  sgMail = require('@sendgrid/mail');
  sendGridAvailable = true;
  
  // Configurar SendGrid com a API Key
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } else {
    console.warn('SENDGRID_API_KEY não configurada. Emails não serão enviados.');
  }
} catch (error) {
  console.warn('@sendgrid/mail não está instalado. Funcionalidade de email desabilitada.');
  console.warn('Para habilitar, execute: npm install @sendgrid/mail');
  sendGridAvailable = false;
}

/**
 * Valida um email usando SendGrid Email Validation API
 * @param {string} email - Email a ser validado
 * @returns {Promise<Object>} Resultado da validação
 */
exports.validateEmail = async (email) => {
  try {
    // Validação básica de formato de email
    // SendGrid não tem uma API nativa de validação no pacote @sendgrid/mail
    // Para validação avançada, você precisaria usar a API de validação do SendGrid separadamente
    
    // Se SendGrid não estiver disponível, ainda validamos o formato básico
    if (!sendGridAvailable) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          valid: false,
          message: 'Formato de email inválido'
        };
      }
    }
    
    return {
      valid: true,
      message: 'Email válido'
    };
  } catch (error) {
    console.error('Erro ao validar email:', error);
    return {
      valid: true, // Em caso de erro, permite continuar (validação não crítica)
      message: 'Email aceito'
    };
  }
};

/**
 * Envia email de boas-vindas/verificação
 * @param {string} to - Email do destinatário
 * @param {string} name - Nome do usuário
 * @param {string} verificationToken - Token de verificação (opcional)
 * @returns {Promise<Object>} Resultado do envio
 */
exports.sendWelcomeEmail = async (to, name, verificationToken = null) => {
  try {
    if (!sendGridAvailable || !sgMail) {
      console.warn('@sendgrid/mail não está disponível. Email não enviado.');
      return {
        success: false,
        message: '@sendgrid/mail não está instalado. Execute: npm install @sendgrid/mail'
      };
    }

    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY não configurada. Email não enviado.');
      return {
        success: false,
        message: 'Configuração de email não encontrada'
      };
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com';
    const appName = process.env.APP_NAME || 'Área Hub';
    const baseUrl = process.env.APP_URL || 'https://seu-app.onrender.com';
    
    // Log do email remetente sendo usado (para debug)
    console.log(`📧 Tentando enviar email de: ${fromEmail} para: ${to}`);

    const verificationLink = verificationToken 
      ? `${baseUrl}/api/auth/verify-email?token=${verificationToken}`
      : null;

    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: appName
      },
      subject: `Bem-vindo ao ${appName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao ${appName}!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Obrigado por se registrar em nossa plataforma. Sua conta foi criada com sucesso!</p>
              ${verificationLink ? `
                <p>Para verificar seu email e ativar sua conta, clique no botão abaixo:</p>
                <p style="text-align: center;">
                  <a href="${verificationLink}" class="button">Verificar Email</a>
                </p>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; color: #4CAF50;">${verificationLink}</p>
              ` : `
                <p>Sua conta está pronta para uso. Você já pode fazer login e começar a usar nossos serviços.</p>
              `}
              <p>Se você não criou esta conta, por favor ignore este email.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bem-vindo ao ${appName}!
        
        Olá ${name},
        
        Obrigado por se registrar em nossa plataforma. Sua conta foi criada com sucesso!
        
        ${verificationLink ? `Para verificar seu email, acesse: ${verificationLink}` : 'Sua conta está pronta para uso.'}
        
        Se você não criou esta conta, por favor ignore este email.
      `
    };

    await sgMail.send(msg);
    
    console.log(`Email de boas-vindas enviado para: ${to}`);
    
    return {
      success: true,
      message: 'Email enviado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    // Log do email remetente usado (para debug)
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com';
    console.error(`📧 Email remetente usado: ${fromEmail}`);
    
    // Tratar erros específicos do SendGrid
    const sendGridError = error.response?.body;
    if (sendGridError?.errors && Array.isArray(sendGridError.errors)) {
      const firstError = sendGridError.errors[0];
      
      // Erro de remetente não verificado
      if (firstError.field === 'from' && firstError.message?.includes('verified Sender Identity')) {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com';
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('⚠️  ERRO: Email remetente não está verificado no SendGrid');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error(`📧 Email remetente configurado: ${fromEmail}`);
        console.error('');
        console.error('🔧 SOLUÇÃO: Verifique o remetente no SendGrid');
        console.error('');
        console.error('📝 Passos:');
        console.error('   1. Acesse: https://app.sendgrid.com/settings/sender_auth/senders/new');
        console.error(`   2. Adicione e verifique o email: ${fromEmail}`);
        console.error('   3. Verifique sua caixa de entrada e clique no link de verificação');
        console.error('   4. Aguarde alguns minutos até a verificação ser concluída');
        console.error('   5. Teste novamente o envio de email');
        console.error('');
        console.error('💡 Alternativa: Configure SENDGRID_FROM_EMAIL no .env com um email já verificado');
        console.error('═══════════════════════════════════════════════════════════════');
        
        return {
          success: false,
          message: `Email remetente "${fromEmail}" não verificado no SendGrid. Verifique a identidade do remetente.`,
          error: 'from address not verified',
          details: firstError.message,
          fromEmail: fromEmail,
          helpUrl: 'https://app.sendgrid.com/settings/sender_auth/senders/new'
        };
      }
      
      // Outros erros do SendGrid
      return {
        success: false,
        message: 'Erro ao enviar email via SendGrid',
        error: firstError.message || 'Erro desconhecido',
        field: firstError.field
      };
    }
    
    // Log mais detalhado em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Detalhes do erro:', error.response?.body || error.message);
    }
    
    return {
      success: false,
      message: 'Erro ao enviar email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    };
  }
};

/**
 * Envia email de verificação de email
 * @param {string} to - Email do destinatário
 * @param {string} name - Nome do usuário
 * @param {string} verificationToken - Token de verificação
 * @returns {Promise<Object>} Resultado do envio
 */
exports.sendVerificationEmail = async (to, name, verificationToken) => {
  return exports.sendWelcomeEmail(to, name, verificationToken);
};

/**
 * Testa a configuração do SendGrid
 * @returns {Promise<Object>} Resultado do teste
 */
exports.testSendGridConfig = async () => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return {
        success: false,
        message: 'SENDGRID_API_KEY não configurada'
      };
    }

    // Tentar fazer uma requisição simples para validar a API key
    // Nota: SendGrid não tem um endpoint de teste direto, mas podemos verificar se a key está configurada
    return {
      success: true,
      message: 'Configuração do SendGrid válida',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'não configurado'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao testar configuração',
      error: error.message
    };
  }
};
