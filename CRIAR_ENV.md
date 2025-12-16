# ⚠️ IMPORTANTE: Criar arquivo .env

O arquivo `.env` não pode ser criado automaticamente por questões de segurança.

## 📝 Passos para criar o arquivo .env:

1. No diretório `node-app/`, crie um arquivo chamado `.env`

2. Adicione o seguinte conteúdo:

```env
# Configurações do Supabase
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==

# Outras variáveis de ambiente (ajuste conforme necessário)
# MONGODB_URI=mongodb://localhost:27017/node-user-api
# JWT_SECRET=sua-chave-secreta-aqui
# JWT_EXPIRES_IN=7d
# PORT=3000
# NODE_ENV=development
```

## 🚀 Após criar o arquivo:

1. Reinicie o servidor backend para carregar a nova variável
2. O endpoint `/api/auth/supabase-token` estará pronto para uso

## 💡 Dica:

Você pode copiar o arquivo `.env.example` para `.env`:

```bash
cd node-app
cp .env.example .env
```

Depois edite o `.env` e adicione as outras variáveis necessárias (MONGODB_URI, JWT_SECRET, etc) se ainda não estiverem configuradas.

