# Como Usar o Role (Admin) no Front-End

Este documento explica como o front-end pode identificar e usar a informação de que um usuário é admin.

## 📋 Informações Disponíveis

O sistema fornece a informação de `role` de **duas formas**:

### 1. No Objeto User (Respostas da API)

Todas as respostas que retornam dados do usuário incluem o campo `role`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Administrador",
      "email": "admin@example.com",
      "role": "admin",        // ← Campo role aqui
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. No JWT Token (Decodificado)

O JWT token também contém o `role`, permitindo verificação sem requisição adicional:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "role": "admin",           // ← Role no token
  "email": "admin@example.com",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## 🔍 Endpoints que Retornam Role

### Login
```bash
POST /api/auth/login
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "admin"  // ← Aqui
    },
    "token": "..."
  }
}
```

### Registro
```bash
POST /api/auth/register
```

**Resposta:** Mesma estrutura do login

### Obter Perfil (Get Me)
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "admin"  // ← Aqui
  }
}
```

## 💻 Exemplos de Uso no Front-End

### React/Next.js

```javascript
// 1. Após login, salvar no estado/context
const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(false);

const handleLogin = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    setUser(data.data.user);
    setIsAdmin(data.data.user.role === 'admin');
    localStorage.setItem('token', data.data.token);
  }
};

// 2. Verificar do token (sem requisição)
const checkAdminFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin';
  } catch (error) {
    return false;
  }
};

// 3. Componente condicional
function AdminPanel() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <div>Acesso negado. Apenas administradores.</div>;
  }
  
  return <div>Painel Admin</div>;
}

// 4. Hook personalizado
function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}

// Uso
function MyComponent() {
  const isAdmin = useIsAdmin();
  
  return (
    <div>
      {isAdmin && <AdminButton />}
      <RegularContent />
    </div>
  );
}
```

### Vue.js

```javascript
// 1. Store (Vuex/Pinia)
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  
  getters: {
    isAdmin: (state) => state.user?.role === 'admin'
  },
  
  actions: {
    async login(email, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.user = data.data.user;
        this.token = data.data.token;
      }
    }
  }
});

// 2. Componente
<template>
  <div>
    <AdminPanel v-if="isAdmin" />
    <UserPanel v-else />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { isAdmin } = storeToRefs(authStore);
</script>
```

### Vanilla JavaScript

```javascript
// 1. Função helper
function isAdmin(user) {
  return user?.role === 'admin';
}

// 2. Verificar do token
function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (error) {
    return null;
  }
}

// 3. Uso
const token = localStorage.getItem('token');
const role = getRoleFromToken(token);

if (role === 'admin') {
  // Mostrar funcionalidades admin
  document.getElementById('admin-panel').style.display = 'block';
} else {
  // Ocultar funcionalidades admin
  document.getElementById('admin-panel').style.display = 'none';
}
```

## 🔐 Valores Possíveis do Role

- `"user"` - Usuário comum (padrão)
- `"admin"` - Administrador

## ✅ Boas Práticas

### 1. Sempre Validar no Backend

⚠️ **IMPORTANTE:** A validação no front-end é apenas para UX. **SEMPRE** valide no backend!

```javascript
// Front-end: Mostrar/ocultar UI
{isAdmin && <AdminButton />}

// Backend: Validar permissão (já implementado)
router.get('/admin/users', protect, authorize('admin'), getUsers);
```

### 2. Verificar Após Login

```javascript
// Após login bem-sucedido
const user = loginResponse.data.user;
if (user.role === 'admin') {
  // Redirecionar para dashboard admin
  router.push('/admin/dashboard');
} else {
  // Redirecionar para dashboard usuário
  router.push('/dashboard');
}
```

### 3. Atualizar Após Mudança de Role

Se o role do usuário for alterado, faça logout/login novamente ou atualize o estado:

```javascript
// Verificar role atualizado
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: user } = await response.json();
setUser(user);
```

### 4. Decodificar Token com Segurança

```javascript
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}
```

## 🧪 Testando

### Verificar Role no Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}' \
  | jq '.data.user.role'
```

### Verificar Role no Token

```bash
# Fazer login e extrair token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}' \
  | jq -r '.data.token')

# Decodificar token (apenas payload)
echo $TOKEN | cut -d. -f2 | base64 -d | jq '.role'
```

## 📚 Resumo

✅ **Role já está disponível** no objeto `user` de todas as respostas  
✅ **Role também está no JWT token** para verificação rápida  
✅ **Valores:** `"user"` ou `"admin"`  
✅ **Sempre validar no backend** (já implementado)  
✅ **Front-end usa apenas para UX** (mostrar/ocultar elementos)

## 🔗 Endpoints Relacionados

- `POST /api/auth/login` - Retorna user com role
- `POST /api/auth/register` - Retorna user com role
- `GET /api/auth/me` - Retorna user atual com role
- `GET /api/users` - Lista usuários (apenas admin)
- `POST /api/users` - Criar usuário (apenas admin)

