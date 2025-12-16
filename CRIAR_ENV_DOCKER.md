# Criar arquivo .env.docker

Execute este comando no diretório `node-app/`:

```bash
cd ~/projetos/node-app
cat > .env.docker << 'EOF'
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://mongo:27017/node-user-api
JWT_SECRET=minha-chave-secreta-super-segura-123456
JWT_EXPIRES_IN=7d
EOF
```

Ou use o script:

```bash
cd ~/projetos/node-app
chmod +x criar-env-docker.sh
./criar-env-docker.sh
```

Depois recrie o container:

```bash
docker-compose down
docker-compose up -d
```

Verifique:

```bash
docker exec node-user-api printenv | grep SUPABASE
```

