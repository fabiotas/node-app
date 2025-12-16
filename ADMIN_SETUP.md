# Configuração de Usuário Admin

Este documento explica como configurar e gerenciar usuários administradores no sistema.

## 🎯 Abordagem Recomendada

O sistema utiliza uma **abordagem híbrida** que combina:

1. **Seed Automático**: Criação automática do admin inicial na primeira inicialização
2. **Variáveis de Ambiente**: Configuração segura via arquivo `.env`
3. **Script CLI**: Ferramenta para criar admins adicionais quando necessário

## 📋 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=senha_segura_aqui
ADMIN_NAME=Administrador
```

**⚠️ IMPORTANTE:**
- Use uma senha forte e segura
- Não commite o arquivo `.env` no repositório
- Altere essas credenciais em produção

### 2. Inicialização Automática

Quando o servidor iniciar pela primeira vez, o sistema irá:

1. Conectar ao banco de dados
2. Verificar se já existe algum usuário admin
3. Se não existir, criar automaticamente o admin usando as variáveis de ambiente
4. Se o email já existir (mas não for admin), atualizar para admin

**Logs esperados:**
```
MongoDB conectado: localhost
✓ Usuário admin criado com sucesso!
  Email: admin@example.com
  Nome: Administrador
```

## 🔧 Criar Admins Adicionais

### Opção 1: Script CLI (Recomendado)

```bash
# Usando npm script
npm run create-admin admin2@example.com senha123 "Nome do Admin"

# Ou diretamente
node scripts/create-admin.js admin2@example.com senha123 "Nome do Admin"
```

### Opção 2: Via API (requer autenticação admin)

```bash
# Primeiro, faça login como admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha_segura_aqui"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Criar novo admin via API
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Admin",
    "email": "admin2@example.com",
    "password": "senha123",
    "role": "admin"
  }'
```

### Opção 3: Script Shell (Docker)

Se estiver usando Docker, você pode usar o script existente:

```bash
./create-admin.sh
```

## 🔒 Segurança

### Boas Práticas

1. **Senhas Fortes**: Use senhas com pelo menos 12 caracteres, incluindo letras, números e símbolos
2. **Variáveis de Ambiente**: Nunca hardcode credenciais no código
3. **Rotação de Senhas**: Altere senhas periodicamente
4. **Ambiente de Produção**: Use variáveis de ambiente diferentes para cada ambiente
5. **Acesso Limitado**: Crie apenas o número necessário de admins

### Exemplo de Senha Segura

```env
ADMIN_PASSWORD=MyS3cur3P@ssw0rd!2024
```

## 🐛 Troubleshooting

### Admin não foi criado automaticamente

**Verifique:**
1. As variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão no `.env`?
2. O servidor foi reiniciado após adicionar as variáveis?
3. Verifique os logs do servidor para mensagens de erro

**Solução:**
```bash
# Criar manualmente via script
npm run create-admin admin@example.com senha123
```

### Email já está em uso

Se o email já existe mas não é admin, o sistema tentará atualizar automaticamente. Se falhar, use:

```bash
npm run create-admin admin@example.com nova_senha
```

### Esqueci a senha do admin

1. Use o script CLI para criar um novo admin
2. Ou atualize via MongoDB diretamente (não recomendado em produção)

## 📝 Comparação de Abordagens

| Abordagem | Segurança | Conveniência | Manutenibilidade | Recomendado |
|-----------|-----------|--------------|------------------|-------------|
| **Seed Automático + Env** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **SIM** |
| Variável de Ambiente (só email) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ❌ |
| Script Manual | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⚠️ Parcial |
| Endpoint Especial | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ❌ |
| Hardcoded | ⭐ | ⭐⭐⭐⭐ | ⭐ | ❌ |

## 🎓 Por que esta abordagem?

### Vantagens

✅ **Segurança**: Senhas não ficam no código  
✅ **Automação**: Criação automática na primeira execução  
✅ **Flexibilidade**: Fácil de configurar por ambiente  
✅ **Manutenibilidade**: Código limpo e documentado  
✅ **Escalabilidade**: Fácil adicionar novos admins  
✅ **Zero Config**: Funciona out-of-the-box com .env  

### Como Funciona

```
Inicialização do Servidor
    ↓
Conectar ao MongoDB
    ↓
Verificar se existe admin
    ↓
┌─────────────────┐
│ Existe admin?   │
└─────────────────┘
    │
    ├─ SIM → Continuar normalmente
    │
    └─ NÃO → Verificar variáveis de ambiente
              ↓
         ┌─────────────────────┐
         │ Variáveis configuradas? │
         └─────────────────────┘
              │
              ├─ SIM → Criar admin automaticamente
              │
              └─ NÃO → Log de aviso (não bloqueia)
```

## 📚 Referências

- [Documentação do Mongoose](https://mongoosejs.com/)
- [Best Practices - Environment Variables](https://12factor.net/config)
- [OWASP - Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

