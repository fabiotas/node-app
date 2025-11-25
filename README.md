# Node User API

API RESTful para gerenciamento de usuários com autenticação JWT.

## Tecnologias

- Node.js + Express.js
- MongoDB (Mongoose)
- JWT para autenticação
- Docker + Docker Compose

## Executar com Docker

```bash
# Iniciar todos os serviços
docker-compose up --build -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Serviços disponíveis:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| API | http://localhost:3000 | API Node.js |
| MongoDB | localhost:27017 | Banco de dados |
| Mongo Express | http://localhost:8081 | Interface web MongoDB (admin/admin123) |

## Endpoints da API

### Autenticação

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/api/auth/register` | Registrar novo usuário | Público |
| POST | `/api/auth/login` | Login | Público |
| GET | `/api/auth/me` | Obter perfil do usuário logado | Privado |
| PUT | `/api/auth/me` | Atualizar perfil | Privado |

### Usuários (CRUD)

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/users` | Listar todos os usuários | Admin |
| GET | `/api/users/:id` | Buscar usuário por ID | Privado |
| POST | `/api/users` | Criar novo usuário | Admin |
| PUT | `/api/users/:id` | Atualizar usuário | Privado |
| DELETE | `/api/users/:id` | Deletar usuário | Admin |
| PATCH | `/api/users/:id/password` | Atualizar senha | Privado |

## Exemplos de Requisições

### Registrar Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "123456"
  }'
```

### Listar Usuários (com autenticação)

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Estrutura do Projeto

```
node-app/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── validators.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   └── server.js
├── .dockerignore
├── .env
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Modelo de Usuário

```javascript
{
  name: String,      // Nome (2-100 caracteres)
  email: String,     // Email único
  password: String,  // Senha (mínimo 6 caracteres)
  role: String,      // 'user' ou 'admin'
  active: Boolean,   // Status da conta
  createdAt: Date,
  updatedAt: Date
}
```
