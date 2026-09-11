export function logger(request, response, next) {
  const startedAt = Date.now();

  response.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`);
  });

  next();
}