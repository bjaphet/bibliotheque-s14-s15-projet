import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`API bibliothèque démarrée sur le port ${env.port}`);
});