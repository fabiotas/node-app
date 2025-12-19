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

# Argumentos de build (apenas para variáveis não-sensíveis)
ARG PORT=3000
ARG NODE_ENV=development
ARG JWT_EXPIRES_IN=7d

# Variáveis de ambiente (apenas não-sensíveis)
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}

# Criar script de entrypoint que gera .env em runtime a partir das variáveis de ambiente
# Isso evita expor secrets no histórico da imagem Docker
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo '# Criar .env a partir das variáveis de ambiente (runtime, não build-time)' >> /entrypoint.sh && \
    echo 'cat > .env << EOF' >> /entrypoint.sh && \
    echo 'MONGODB_URI=${MONGODB_URI}' >> /entrypoint.sh && \
    echo 'PORT=${PORT:-3000}' >> /entrypoint.sh && \
    echo 'JWT_SECRET=${JWT_SECRET}' >> /entrypoint.sh && \
    echo 'JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}' >> /entrypoint.sh && \
    echo 'NODE_ENV=${NODE_ENV:-development}' >> /entrypoint.sh && \
    echo 'SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}' >> /entrypoint.sh && \
    echo 'ADMIN_EMAIL=${ADMIN_EMAIL}' >> /entrypoint.sh && \
    echo 'ADMIN_PASSWORD=${ADMIN_PASSWORD}' >> /entrypoint.sh && \
    echo 'ADMIN_NAME=${ADMIN_NAME}' >> /entrypoint.sh && \
    echo 'EOF' >> /entrypoint.sh && \
    echo '# Executar o comando original' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]
