FROM node:20-slim

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Argumentos de build
# NOTA: Para produção/CI-CD, passe esses valores via --build-arg ou secrets do GitHub
# Para desenvolvimento local, o docker-compose passa via environment (runtime)
ARG MONGODB_URI
ARG JWT_SECRET
ARG JWT_EXPIRES_IN=7d
ARG PORT=3000
ARG NODE_ENV=development
ARG SUPABASE_JWT_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD
ARG ADMIN_NAME

# Variáveis de ambiente
ENV MONGODB_URI=${MONGODB_URI}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}
ENV SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_NAME=${ADMIN_NAME}

# Criar arquivo .env com todas as variáveis (linhas 1-13 do .env)
RUN echo "MONGODB_URI=${MONGODB_URI}" > .env && \
    echo "PORT=${PORT}" >> .env && \
    echo "JWT_SECRET=${JWT_SECRET}" >> .env && \
    echo "JWT_EXPIRES_IN=${JWT_EXPIRES_IN}" >> .env && \
    echo "NODE_ENV=${NODE_ENV}" >> .env && \
    echo "SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}" >> .env && \
    echo "ADMIN_EMAIL=${ADMIN_EMAIL}" >> .env && \
    echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env && \
    echo "ADMIN_NAME=${ADMIN_NAME}" >> .env

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]
