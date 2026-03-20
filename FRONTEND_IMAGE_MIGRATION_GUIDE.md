# Guia de adaptacao do frontend (migracao de imagens)

Este guia descreve as alteracoes necessarias no frontend (`/projetos/react-front`) para funcionar com o novo fluxo de imagens do backend.

## Resumo da mudanca no backend

- O backend agora salva arquivos localmente na VPS (pasta `uploads`).
- Os arquivos ficam publicos em `GET /uploads/...`.
- Upload de imagem agora retorna URL absoluta (exemplo: `https://api.areahub.com.br/uploads/areas/arquivo.jpg`).
- Areas continuam salvando imagens no campo `images` (array de strings URL).
- Foi adicionado suporte a `shareImageIndex` e `shareImage` na resposta de area.

## Endpoints relevantes

- Upload autenticado:
  - `POST /api/upload`
  - `multipart/form-data`
  - Campo: `file` (1 imagem) ou `files` (multiplas imagens)
  - Query opcional: `?folder=areas` ou `?folder=avatar`
- Leitura publica de imagens:
  - `GET /uploads/:subpasta/:arquivo`
- CRUD de areas:
  - `POST /api/areas`
  - `PUT /api/areas/:id`
  - `GET /api/areas`
  - `GET /api/areas/:id`

## Formato de resposta do upload

Upload unico:

```json
{
  "success": true,
  "url": "https://api.areahub.com.br/uploads/areas/abc.jpg"
}
```

Upload multiplo:

```json
{
  "success": true,
  "urls": [
    "https://api.areahub.com.br/uploads/areas/a.jpg",
    "https://api.areahub.com.br/uploads/areas/b.jpg"
  ]
}
```

## O que alterar no frontend

1. **Base URL da API**
   - Definir `VITE_API_URL=https://api.areahub.com.br`.
   - Todas as chamadas devem usar esse dominio (nao IP/porta antiga).

2. **Fluxo de upload de imagem**
   - Em vez de enviar base64 no payload da area, enviar arquivo para `POST /api/upload`.
   - Enviar `Authorization: Bearer <token>`.
   - Para area: usar `?folder=areas`.
   - Salvar no estado o retorno `url`/`urls`.

3. **Criacao de area (`POST /api/areas`)**
   - Campo `images` deve ser `string[]` com URLs retornadas no upload.
   - Enviar `shareImageIndex` (numero) quando houver imagens.
   - Exemplo:
   ```json
   {
     "name": "Area Exemplo",
     "description": "Descricao...",
     "address": "Endereco...",
     "pricePerDay": 250,
     "maxGuests": 10,
     "amenities": ["wifi", "churrasqueira"],
     "images": [
       "https://api.areahub.com.br/uploads/areas/a.jpg",
       "https://api.areahub.com.br/uploads/areas/b.jpg"
     ],
     "shareImageIndex": 0
   }
   ```

4. **Edicao de area (`PUT /api/areas/:id`)**
   - Manter `images` como array de URLs.
   - Se remover/reordenar imagens, recalcular `shareImageIndex`.
   - Se `shareImageIndex` ficar fora do tamanho de `images`, backend retorna erro 400.

5. **Renderizacao no frontend**
   - Tratar `area.images` como URLs prontas para `<img src="...">`.
   - Preferir `area.shareImage` para previews/compartilhamento (fallback: `area.images[0]`).
   - Nao concatenar manualmente com dominio se a URL ja vier absoluta.

6. **CORS e dominio**
   - Garantir que o dominio do frontend esteja em `FRONTEND_URL` no backend.
   - Em producao, usar somente HTTPS no frontend e API.

## Checklist de validacao

- [ ] Upload de 1 imagem retorna `url`.
- [ ] Upload multiplo retorna `urls`.
- [ ] Criar area com imagens funciona.
- [ ] Editar area preservando/reordenando imagens funciona.
- [ ] `shareImageIndex` e `shareImage` aparecem corretos na resposta.
- [ ] Cards/listagem exibem imagens sem quebrar.
- [ ] Nenhuma tela depende de base64 antigo.

## Erros comuns

- **401 no upload**: faltou token Bearer.
- **400 arquivo muito grande**: limite definido por `UPLOAD_MAX_FILE_SIZE_MB`.
- **400 tipo invalido**: so aceita `jpeg/png/webp/gif`.
- **Imagem quebrada no frontend**: URL relativa ou dominio antigo salvo em `images`.

## Observacao de migracao de dados antigos

Se existirem areas antigas com imagens em formato diferente (ex: base64), considerar script de migracao ou fallback visual no frontend para nao quebrar listagens.
