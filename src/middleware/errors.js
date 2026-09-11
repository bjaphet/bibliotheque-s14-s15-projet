export function notFound(_request, response) {
  response.status(404).json({ error: 'Route introuvable' });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);

  if (error.code === '23505') {
    return response.status(409).json({ error: 'Cette ressource existe déjà' });
  }

  if (error.code === '23503') {
    return response.status(409).json({ error: 'Cette ressource est encore liée à une autre donnée' });
  }

  response.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Erreur interne du serveur'
  });
}

export function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}