# 🚀 Configuração CI/CD com GitHub Actions

Este guia explica como configurar o CI/CD para build e push automático da imagem Docker.

## 📋 Pré-requisitos

1. Repositório no GitHub
2. Acesso ao GitHub Container Registry (ghcr.io)

## 🔐 Configurar Secrets no GitHub

Para que o CI/CD funcione corretamente, você precisa configurar os seguintes **Secrets** no seu repositório GitHub:

### Como adicionar Secrets:

1. Vá para: `Settings` → `Secrets and variables` → `Actions`
2. Clique em `New repository secret`
3. Adicione cada um dos secrets abaixo:

### Secrets necessários:

| Secret Name | Descrição | Exemplo |
|------------|-----------|---------|
| `MONGODB_URI` | URI de conexão do MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `JWT_SECRET` | Chave secreta para JWT | `sua-chave-secreta-super-segura` |
| `SUPABASE_JWT_SECRET` | Chave secreta do Supabase | `XlE6/JHFrn/z0zwkD+...` |
| `ADMIN_EMAIL` | Email do admin inicial | `admin@example.com` |
| `ADMIN_PASSWORD` | Senha do admin inicial | `senha_segura_123` |
| `ADMIN_NAME` | Nome do admin inicial | `Administrador` |

## 🔄 Como funciona

O workflow `.github/workflows/docker-build.yml` será executado automaticamente quando:

- ✅ Push para branch `main` ou `master`
- ✅ Criação de tags `v*` (ex: `v1.0.0`)
- ✅ Pull Requests para `main` ou `master` (apenas build, sem push)

## 📦 Onde a imagem será publicada?

A imagem será publicada no **GitHub Container Registry**:
```
ghcr.io/SEU_USUARIO/SEU_REPOSITORIO:latest
ghcr.io/SEU_USUARIO/SEU_REPOSITORIO:main
ghcr.io/SEU_USUARIO/SEU_REPOSITORIO:v1.0.0
```

## 🐳 Como usar a imagem

Após o build, você pode usar a imagem assim:

```bash
docker pull ghcr.io/SEU_USUARIO/SEU_REPOSITORIO:latest

docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI="sua-uri-mongodb" \
  -e JWT_SECRET="sua-chave-secreta" \
  ghcr.io/SEU_USUARIO/SEU_REPOSITORIO:latest
```

## 🔍 Verificar se está funcionando

1. Faça um push para a branch `main`
2. Vá para a aba `Actions` no GitHub
3. Verifique se o workflow foi executado com sucesso
4. A imagem estará disponível em: `Packages` → `SEU_REPOSITORIO`

## ⚠️ Importante

- **NUNCA** commite credenciais no código
- Use sempre **Secrets** do GitHub para valores sensíveis
- O `GITHUB_TOKEN` é criado automaticamente, não precisa configurar

## 🛠️ Build local (para desenvolvimento)

Para build local com docker-compose, as variáveis são passadas via `environment` no `docker-compose.yml`, então não precisa passar `--build-arg`.

Para build manual:

```bash
docker build \
  --build-arg MONGODB_URI="sua-uri" \
  --build-arg JWT_SECRET="sua-chave" \
  -t minha-app:latest .
```

