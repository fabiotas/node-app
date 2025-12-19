#!/bin/bash

echo "🔄 Parando containers..."
docker-compose down

echo "🚀 Recriando containers com novas variáveis..."
docker-compose up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 3

echo "✅ Verificando variável MONGODB_URI no container..."
docker exec node-user-api printenv | grep MONGODB_URI

echo ""
echo "📋 Logs do container (últimas 20 linhas):"
docker-compose logs --tail=20 api

