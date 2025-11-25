#!/bin/bash

echo "=== Criando usuario admin ==="
# Atualizar usuario existente para admin via MongoDB
docker exec mongodb mongosh node-user-api --eval '
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)'

echo ""
echo "=== Fazendo login ==="
RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}')

echo $RESULT | python3 -m json.tool 2>/dev/null || echo $RESULT

TOKEN=$(echo $RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "Token: $TOKEN"
echo ""

echo "=== Listando todos usuarios ==="
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null

