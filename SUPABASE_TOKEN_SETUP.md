# Configuração do Endpoint Supabase Token

## ✅ Implementação Concluída

O endpoint `/api/auth/supabase-token` foi implementado e está pronto para uso.

## 📋 Variável de Ambiente Necessária

Adicione a seguinte variável ao seu arquivo `.env`:

```env
SUPABASE_JWT_SECRET=seu-jwt-secret-aqui
```

## 🔑 Como Obter o JWT Secret do Supabase

1. Acesse o painel do Supabase: https://app.supabase.com
2. **Selecione seu projeto** (o projeto onde está configurado o bucket `area-images`)
3. Dentro do projeto, vá em **Settings** (⚙️ Configurações) → **API**
4. Role até a seção **JWT Settings**
5. Copie o **JWT Secret** (é uma string longa, tipo: `your-super-secret-jwt-token-with-at-least-32-characters-long`)

⚠️ **IMPORTANTE**: 
- O JWT Secret é específico de cada projeto no Supabase
- Nunca exponha o JWT Secret no frontend! Ele deve estar apenas no backend
- Mantenha o JWT Secret seguro e nunca commite no Git (use variáveis de ambiente)

## 📡 Endpoint

```
GET /api/auth/supabase-token
Headers: Authorization: Bearer {token-do-usuário}
```

### Resposta de Sucesso (200)

```json
{
  "success": true,
  "supabaseToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Respostas de Erro

**401 - Não autenticado:**
```json
{
  "success": false,
  "message": "Acesso nao autorizado. Token nao fornecido"
}
```

**500 - Configuração faltando:**
```json
{
  "success": false,
  "message": "Configuracao do Supabase nao encontrada. Verifique SUPABASE_JWT_SECRET"
}
```

## 🧪 Testando o Endpoint

```bash
# Obter token de autenticação primeiro (fazendo login)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'

# Usar o token retornado para obter o token do Supabase
curl -X GET http://localhost:3000/api/auth/supabase-token \
  -H "Authorization: Bearer {token-retornado-no-login}"
```

## 📝 Notas

- O token gerado expira em 1 hora
- O token inclui informações do usuário (ID, email, nome, role)
- O endpoint requer autenticação (middleware `protect`)
- O token é usado pelo frontend para fazer upload de imagens no Supabase Storage

## 🔄 Integração com Frontend

O frontend já está configurado para usar este endpoint automaticamente. Quando um usuário autenticado tentar fazer upload de uma imagem, o frontend:

1. Verifica se há um token em cache
2. Se não houver ou estiver expirado, chama este endpoint
3. Usa o token retornado para autenticar no Supabase Storage

