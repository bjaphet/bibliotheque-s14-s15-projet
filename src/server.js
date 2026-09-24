import { app } from './application.js';
import { env } from './config/env.js';

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`API bibliothèque démarrée sur le port ${env.port}`);
  });
}

export default app;