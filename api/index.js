import { app } from '../src/app.js';

export default function handler(request, response) {
	// Vercel peut transmettre le chemin avec ou sans le préfixe /api.
	if (!request.url.startsWith('/api')) {
		request.url = `/api${request.url.startsWith('/') ? request.url : `/${request.url}`}`;
	}

	return app(request, response);
}