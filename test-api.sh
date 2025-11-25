#!/bin/bash

echo "=== Testando Health Check ==="
curl -s http://localhost:3000/api/health
echo -e "\n"

echo "=== Registrando Usuario ==="
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@test.com","password":"123456"}'
echo -e "\n"

echo "=== Fazendo Login ==="
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
echo -e "\n"

if [ -n "$TOKEN" ]; then
  echo "=== Buscando Perfil ==="
  curl -s http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer $TOKEN"
  echo -e "\n"
fi

