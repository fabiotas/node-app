# 🔧 Solução: MONGODB_URI não atualizando no Docker

## Problema

Após alterar o `MONGODB_URI` no `docker-compose.yml` e no `.env`, o container ainda está usando o valor antigo.

## Causa

O problema ocorre porque:
1. O volume `.:/app` monta o diretório completo, incluindo o `.env`
2. O `dotenv.config()` carrega o `.env` quando a aplicação inicia
3. Se o container não for **recriado completamente**, as variáveis do `docker-compose.yml` não são aplicadas

## ✅ Solução Completa

### Passo 1: Garantir que o docker-compose.yml está correto

Verifique se a linha 12 do `docker-compose.yml` tem a URI correta:

```yaml
- MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```

### Passo 2: Recriar os containers (NÃO apenas reiniciar)

```bash
cd /home/fabiot/projetos/node-app

# Parar e remover os containers
docker-compose down

# Recriar os containers com as novas variáveis
docker-compose up -d --build
```

**⚠️ IMPORTANTE:** Use `docker-compose down` + `up -d`, NÃO `docker-compose restart`!

### Passo 3: Verificar se funcionou

```bash
# Ver qual URI está configurada no container
docker exec node-user-api printenv | grep MONGODB_URI

# Ver os logs para confirmar qual URI está sendo usada
docker-compose logs -f api
```

Nos logs, você deve ver:
```
=== Debug MONGODB_URI ===
URI sendo usada: mongodb+srv://***:***@...
=========================
MongoDB conectado: ...
```

### Passo 4: Se ainda não funcionar

Se ainda estiver usando o valor antigo, há duas possibilidades:

#### Opção A: Remover o MONGODB_URI do .env (Recomendado)

Quando usar Docker, remova a linha `MONGODB_URI` do arquivo `.env` para evitar conflito:

```bash
# Edite o .env e remova ou comente a linha MONGODB_URI
# MONGODB_URI=...  # Comentado porque está no docker-compose.yml
```

#### Opção B: Garantir que o .env tem o mesmo valor

Ou garanta que o `.env` tem exatamente o mesmo valor do `docker-compose.yml`.

## 📝 Nota sobre MongoDB Atlas vs MongoDB Local

Se você está usando **MongoDB Atlas** (URI `mongodb+srv://`), você pode:
- **Remover** o serviço `mongo` local do `docker-compose.yml` (linhas 23-33)
- **Remover** a dependência `depends_on: - mongo` (linha 16-17)

Isso economiza recursos e evita confusão.

## 🔍 Debug Adicional

Se quiser ver todas as variáveis de ambiente no container:

```bash
docker exec node-user-api printenv
```

Para ver os logs em tempo real:

```bash
docker-compose logs -f api
```

