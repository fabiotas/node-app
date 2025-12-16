# Como criar o arquivo .env

## Opção 1: Usando o template (Recomendado)

1. Copie o arquivo `env-template.txt` para `.env`:
   ```bash
   cd node-app
   cp env-template.txt .env
   ```

2. Edite o arquivo `.env` e adicione as outras variáveis necessárias se ainda não estiverem configuradas.

## Opção 2: Criar manualmente

1. Crie um arquivo chamado `.env` no diretório `node-app/`

2. Adicione o seguinte conteúdo:

```env
# Configurações do Supabase
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==

# Outras variáveis de ambiente
MONGODB_URI=mongodb://localhost:27017/node-user-api
JWT_SECRET=minha-chave-secreta-super-segura-123456
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

## ✅ Já configurado no Docker Compose

A variável `SUPABASE_JWT_SECRET` já foi adicionada ao `docker-compose.yml`, então se você estiver usando Docker, não precisa criar o arquivo `.env` - a variável já está disponível no container.

## 🚀 Próximos passos

1. Se estiver usando Docker, reinicie os containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. Se estiver rodando localmente (sem Docker), crie o arquivo `.env` e reinicie o servidor:
   ```bash
   npm start
   # ou
   npm run dev
   ```

