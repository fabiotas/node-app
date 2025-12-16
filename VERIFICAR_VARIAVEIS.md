# 🔍 Verificar Variáveis de Ambiente

## Problema: SUPABASE_JWT_SECRET não configurado

Se você está vendo essa mensagem, significa que a variável de ambiente não está sendo carregada.

## ⚠️ IMPORTANTE: Execute os comandos no HOST, não dentro do container!

## Solução 1: Se estiver usando Docker

**Reinicie o container para carregar as novas variáveis:**

```bash
# Execute no HOST (fora do container)
cd node-app
docker-compose down
docker-compose up -d
```

**Verifique se a variável está sendo carregada (execute no HOST):**

```bash
# Opção 1: Usando docker-compose (no HOST)
docker-compose exec api printenv | grep SUPABASE

# Opção 2: Usando docker diretamente (no HOST)
docker exec node-user-api printenv | grep SUPABASE

# Opção 3: Ver todas as variáveis de ambiente (no HOST)
docker exec node-user-api printenv
```

Deve mostrar:
```
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==
```

## Solução 2: Se estiver rodando localmente (sem Docker)

**Crie o arquivo `.env` no diretório `node-app/`:**

```bash
cd node-app
cat > .env << 'EOF'
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==
MONGODB_URI=mongodb://localhost:27017/node-user-api
JWT_SECRET=minha-chave-secreta-super-segura-123456
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
EOF
```

**Depois reinicie o servidor:**

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
# ou
npm start
```

## Verificar se funcionou

Após reiniciar, você não deve mais ver a mensagem "SUPABASE_JWT_SECRET não configurado" nos logs.

**Ver logs do container (execute no HOST):**
```bash
docker-compose logs -f api
```

Teste o endpoint:
```bash
curl -X GET http://localhost:3000/api/auth/supabase-token \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## Comandos úteis (execute no HOST, não no container)

```bash
# Ver logs em tempo real
docker-compose logs -f api

# Reiniciar apenas o serviço API
docker-compose restart api

# Parar e iniciar todos os serviços
docker-compose down
docker-compose up -d

# Entrar no container (se necessário)
docker exec -it node-user-api sh

# Dentro do container, você pode verificar:
printenv | grep SUPABASE
```
