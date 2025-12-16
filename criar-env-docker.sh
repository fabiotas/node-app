#!/bin/bash
# Script para criar arquivo .env.docker

cat > .env.docker << 'EOF'
# Variáveis de ambiente para Docker
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://mongo:27017/node-user-api
JWT_SECRET=minha-chave-secreta-super-segura-123456
JWT_EXPIRES_IN=7d
EOF

echo "Arquivo .env.docker criado com sucesso!"
echo "Agora execute: docker-compose down && docker-compose up -d"

