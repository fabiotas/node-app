# Roteiro de Alterações - Front-End
## Cadastro de Reservas Externas com Pré-Usuários

### Visão Geral
Implementar funcionalidade para que o dono da área possa cadastrar reservas que foram feitas fora do site, criando automaticamente um pré-usuário (Guest) com as informações fornecidas.

---

## 1. Modelo de Dados

### Pré-Usuário (Guest)
```typescript
interface Guest {
  _id: string;
  name: string;           // Obrigatório
  phone: string;          // Obrigatório
  cpf?: string;           // Opcional (11 dígitos)
  birthDate?: string;     // Opcional (ISO 8601)
  createdAt: string;
  updatedAt: string;
}
```

### Reserva Externa
```typescript
interface ExternalBooking {
  areaId: string;
  checkIn: string;        // ISO 8601
  checkOut: string;      // ISO 8601
  guests: number;
  guest: {
    name: string;         // Obrigatório
    phone: string;        // Obrigatório
    cpf?: string;         // Opcional
    birthDate?: string;   // Opcional (ISO 8601)
  };
  totalPrice?: number;    // Opcional (será calculado se não fornecido)
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Opcional (padrão: 'confirmed')
}
```

---

## 2. Endpoint da API

### POST `/api/bookings/external`
**Autenticação:** Requerida (Bearer Token)
**Permissão:** Apenas dono da área ou admin

#### Request Body
```json
{
  "areaId": "507f1f77bcf86cd799439011",
  "checkIn": "2024-12-25T00:00:00.000Z",
  "checkOut": "2024-12-27T00:00:00.000Z",
  "guests": 2,
  "guest": {
    "name": "João Silva",
    "phone": "(11) 98765-4321",
    "cpf": "12345678901",
    "birthDate": "1990-05-15T00:00:00.000Z"
  },
  "totalPrice": 500.00,
  "status": "confirmed"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Reserva externa criada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "area": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Chácara dos Sonhos",
      "address": "Rua das Flores, 123",
      "pricePerDay": 250.00
    },
    "guest": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "João Silva",
      "phone": "(11) 98765-4321",
      "cpf": "12345678901",
      "birthDate": "1990-05-15T00:00:00.000Z"
    },
    "guestModel": "Guest",
    "checkIn": "2024-12-25T00:00:00.000Z",
    "checkOut": "2024-12-27T00:00:00.000Z",
    "totalPrice": 500.00,
    "guests": 2,
    "status": "confirmed",
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

#### Erros Possíveis
- **400 Bad Request:** Erros de validação (datas inválidas, campos obrigatórios faltando, etc.)
- **403 Forbidden:** Usuário não é dono da área
- **404 Not Found:** Área não encontrada
- **409 Conflict:** Conflito de datas (área já reservada)

---

## 3. Alterações na Interface

### 3.1. Página de Gerenciamento de Reservas da Área

#### Localização Sugerida
- Na página de detalhes da área (área do proprietário)
- Seção: "Reservas" ou "Gerenciar Reservas"
- Botão: "Cadastrar Reserva Externa" ou "Nova Reserva Externa"

#### Componente: Formulário de Reserva Externa

**Campos do Formulário:**

1. **Informações da Reserva**
   - Área (select/readonly - já selecionada)
   - Data de Check-in (date picker) - **Obrigatório**
   - Data de Check-out (date picker) - **Obrigatório**
   - Número de Hóspedes (number input) - **Obrigatório**
   - Preço Total (number input) - **Opcional** (será calculado automaticamente se não preenchido)
   - Status (select) - **Opcional** (padrão: "Confirmada")
     - Opções: Pendente, Confirmada, Cancelada, Concluída

2. **Informações do Hóspede (Pré-Usuário)**
   - Nome (text input) - **Obrigatório**
   - Celular (text input com máscara) - **Obrigatório**
   - CPF (text input com máscara) - **Opcional**
   - Data de Nascimento (date picker) - **Opcional**

#### Validações no Front-End

```typescript
// Validações básicas
- Nome: mínimo 2 caracteres, máximo 100 caracteres
- Celular: formato válido (aceita números, espaços, parênteses, hífens, +)
- CPF: se preenchido, deve ter 11 dígitos (após remover formatação)
- Data de Nascimento: se preenchida, não pode ser no futuro
- Check-out: deve ser posterior ao check-in
- Número de hóspedes: mínimo 1, máximo igual ao maxGuests da área
- Preço Total: se preenchido, deve ser maior que 0
```

#### Máscaras Sugeridas
- **Celular:** `(00) 00000-0000` ou `(00) 0000-0000`
- **CPF:** `000.000.000-00`

#### Comportamento
1. Ao preencher datas, calcular automaticamente o preço total (opcional)
2. Ao submeter, mostrar loading state
3. Em caso de sucesso, mostrar mensagem de sucesso e atualizar lista de reservas
4. Em caso de erro, mostrar mensagens de erro específicas

---

### 3.2. Listagem de Reservas

#### Alterações Necessárias

**Na listagem de reservas da área:**
- Identificar visualmente reservas externas (ex: badge "Reserva Externa" ou ícone)
- Mostrar informações do hóspede:
  - Se for User: mostrar nome e email
  - Se for Guest: mostrar nome, celular, CPF (se disponível) e data de nascimento (se disponível)

**Exemplo de Card de Reserva:**
```
┌─────────────────────────────────────┐
│ Reserva #123                        │
│ [Badge: Reserva Externa]            │
│                                     │
│ Hóspede: João Silva                 │
│ Celular: (11) 98765-4321           │
│ CPF: 123.456.789-01                │
│                                     │
│ Check-in: 25/12/2024               │
│ Check-out: 27/12/2024              │
│ Hóspedes: 2                        │
│ Preço Total: R$ 500,00              │
│ Status: Confirmada                 │
└─────────────────────────────────────┘
```

---

### 3.3. Detalhes da Reserva

#### Alterações Necessárias

**Na página de detalhes da reserva:**
- Mostrar tipo de hóspede (Usuário Registrado ou Pré-Usuário)
- Se for pré-usuário, mostrar todas as informações disponíveis:
  - Nome
  - Celular
  - CPF (se disponível)
  - Data de Nascimento (se disponível)
- Se for usuário registrado, mostrar nome e email

---

## 4. Exemplo de Implementação (React/TypeScript)

### 4.1. Serviço de API

```typescript
// services/bookingService.ts
import api from './api';

export interface ExternalBookingRequest {
  areaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guest: {
    name: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
  };
  totalPrice?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export const createExternalBooking = async (data: ExternalBookingRequest) => {
  const response = await api.post('/bookings/external', data);
  return response.data;
};
```

### 4.2. Componente de Formulário

```typescript
// components/ExternalBookingForm.tsx
import React, { useState } from 'react';
import { createExternalBooking } from '../services/bookingService';

interface ExternalBookingFormProps {
  areaId: string;
  onSuccess?: () => void;
}

export const ExternalBookingForm: React.FC<ExternalBookingFormProps> = ({
  areaId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    guest: {
      name: '',
      phone: '',
      cpf: '',
      birthDate: ''
    },
    totalPrice: '',
    status: 'confirmed'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createExternalBooking({
        areaId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        guest: {
          name: formData.guest.name,
          phone: formData.guest.phone,
          cpf: formData.guest.cpf || undefined,
          birthDate: formData.guest.birthDate || undefined
        },
        totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : undefined,
        status: formData.status as any
      });

      if (onSuccess) {
        onSuccess();
      }
      // Reset form
      setFormData({
        checkIn: '',
        checkOut: '',
        guests: 1,
        guest: {
          name: '',
          phone: '',
          cpf: '',
          birthDate: ''
        },
        totalPrice: '',
        status: 'confirmed'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar reserva externa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Cadastrar Reserva Externa'}
      </button>
    </form>
  );
};
```

---

## 5. Checklist de Implementação

### Backend (Já implementado)
- [x] Modelo Guest criado
- [x] Modelo Booking atualizado para suportar Guest
- [x] Validações criadas
- [x] Controller criado
- [x] Rota criada

### Frontend
- [ ] Criar interface TypeScript para Guest e ExternalBooking
- [ ] Criar serviço de API para criar reserva externa
- [ ] Criar componente de formulário de reserva externa
- [ ] Adicionar máscaras para celular e CPF
- [ ] Adicionar validações no front-end
- [ ] Adicionar botão "Cadastrar Reserva Externa" na página de gerenciamento de área
- [ ] Atualizar listagem de reservas para mostrar reservas externas
- [ ] Atualizar detalhes da reserva para mostrar informações de Guest
- [ ] Adicionar indicador visual para reservas externas
- [ ] Testar fluxo completo

---

## 6. Observações Importantes

1. **Busca de Guest Existente:** O sistema tenta encontrar um Guest existente por CPF ou celular antes de criar um novo. Se encontrar, atualiza as informações se necessário.

2. **Cálculo de Preço:** Se o preço total não for fornecido, o sistema calcula automaticamente considerando preços especiais da área.

3. **Status Padrão:** Reservas externas são criadas com status "confirmed" por padrão, mas pode ser alterado.

4. **Validação de Conflitos:** O sistema verifica conflitos de datas mesmo para reservas externas, mas isso pode ser ajustado se necessário.

5. **Permissões:** Apenas o dono da área ou admin podem cadastrar reservas externas.

---

## 7. Testes Recomendados

1. **Teste de Criação:**
   - Criar reserva externa com todos os campos
   - Criar reserva externa apenas com campos obrigatórios
   - Criar reserva externa com Guest existente (deve atualizar, não criar duplicado)

2. **Teste de Validações:**
   - Tentar criar com datas inválidas
   - Tentar criar com CPF inválido
   - Tentar criar sem campos obrigatórios

3. **Teste de Permissões:**
   - Tentar criar reserva externa sem ser dono da área
   - Verificar se admin pode criar em qualquer área

4. **Teste de UI:**
   - Verificar se máscaras funcionam corretamente
   - Verificar se validações aparecem corretamente
   - Verificar se lista de reservas mostra reservas externas corretamente

---

## 8. Melhorias Futuras (Opcional)

1. **Conversão de Guest para User:** Permitir que um Guest se registre e suas reservas sejam vinculadas ao novo User
2. **Histórico de Guest:** Mostrar todas as reservas de um Guest específico
3. **Busca de Guest:** Permitir buscar Guest por nome, celular ou CPF antes de criar nova reserva
4. **Notificações:** Enviar SMS ou WhatsApp para Guest quando reserva for criada/confirmada
