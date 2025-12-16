# 🔄 Como Reiniciar o Servidor Backend

O erro 404 indica que o servidor precisa ser reiniciado para carregar as novas rotas.

## Se estiver usando Docker:

```bash
cd node-app
docker-compose restart api
# ou
docker-compose down
docker-compose up -d
```

## Se estiver rodando localmente (sem Docker):

### Opção 1: Se estiver usando `npm run dev` (nodemon):
- O nodemon deve reiniciar automaticamente
- Se não reiniciou, pare o servidor (Ctrl+C) e inicie novamente:
  ```bash
  cd node-app
  npm run dev
  ```

### Opção 2: Se estiver usando `npm start`:
- Pare o servidor (Ctrl+C) e inicie novamente:
  ```bash
  cd node-app
  npm start
  ```

## Verificar se está funcionando:

Após reiniciar, teste o endpoint:

```bash
# Primeiro faça login para obter um token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@example.com","password":"sua-senha"}'

# Depois teste o endpoint do Supabase token
curl -X GET http://localhost:3000/api/auth/supabase-token \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Ou simplesmente tente fazer upload de uma imagem no frontend novamente.

