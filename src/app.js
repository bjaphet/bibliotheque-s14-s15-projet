import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authorsRouter from './routes/authors.js';
import membersRouter from './routes/members.js';
import booksRouter from './routes/books.js';
import loansRouter from './routes/loans.js';
import statisticsRouter from './routes/statistics.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

app.use(logger);
app.use(express.json());
app.use(express.static(publicDirectory));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/authors', authorsRouter);
app.use('/api/members', membersRouter);
app.use('/api/books', booksRouter);
app.use('/api/loans', loansRouter);
app.use('/api/statistics', statisticsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;