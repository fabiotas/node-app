// Nome da pasta "uploads" na URL (deve bater com express.static) (deve bater com express.static)
const UPLOADS_URL_PATH = 'uploads';

/**
 * Retorna a URL pública do arquivo.
 * Usa BASE_URL do .env (ex: https://api.seudominio.com) ou monta pelo request.
 */
function getPublicUrl(req, urlPath) {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/${urlPath}`;
}

/**
 * POST /api/upload
 * Body: multipart/form-data, field "file" (uma imagem) ou "files" (várias).
 * Query: ?folder=areas|avatar (default: areas)
 * Retorna: { success, url } ou { success, urls: [] }
 */
exports.uploadImage = (req, res) => {
  const files = (req.files && (req.files.file || req.files.files))
    ? (req.files.file || req.files.files)
    : [];
  const list = Array.isArray(files) ? files : [files];

  if (list.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo enviado. Use o campo "file" ou "files".'
    });
  }

  const subdir = req.query.folder === 'avatar' ? 'avatars' : 'areas';

  if (list.length === 1) {
    const urlPath = `${UPLOADS_URL_PATH}/${subdir}/${list[0].filename}`;
    const url = getPublicUrl(req, urlPath);
    return res.status(201).json({ success: true, url });
  }

  const urls = list.map(f => {
    const urlPath = `${UPLOADS_URL_PATH}/${subdir}/${f.filename}`;
    return getPublicUrl(req, urlPath);
  });
  return res.status(201).json({ success: true, urls });
};
