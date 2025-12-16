# 🔄 Reiniciar Container com Novas Variáveis

A variável `SUPABASE_JWT_SECRET` não está no container porque ele precisa ser **recriado** (não apenas reiniciado).

## ⚠️ IMPORTANTE: Use `docker-compose down` e `up -d` para recriar

O comando `docker-compose restart` **NÃO** recarrega variáveis de ambiente do docker-compose.yml.

## Passos para recriar o container:

```bash
# 1. Pare e remova os containers
cd ~/projetos/node-app
docker-compose down

# 2. Recrie os containers com as novas variáveis
docker-compose up -d

# 3. Verifique se a variável está presente agora
docker exec node-user-api printenv | grep SUPABASE
```

Deve mostrar:
```
SUPABASE_JWT_SECRET=XlE6/JHFrn/z0zwkD+bWCbGrTeIuVzGP+uyEc9xeEONdrPumUffz+I7f0Gg6mRAULaZFiblJCiD23cJw+f8AWA==
```

## Verificar logs após recriar:

```bash
docker-compose logs -f api
```

Você não deve mais ver "SUPABASE_JWT_SECRET não configurado".

## Diferença entre os comandos:

- `docker-compose restart` - Reinicia o container, mas **NÃO** recarrega variáveis de ambiente
- `docker-compose down && docker-compose up -d` - Recria o container e **carrega** as variáveis do docker-compose.yml

