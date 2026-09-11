import express from 'express';
import authorsRouter from './routes/authors.js';
import membersRouter from './routes/members.js';
import booksRouter from './routes/books.js';
import loansRouter from './routes/loans.js';
import statisticsRouter from './routes/statistics.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();

app.use(logger);
app.use(express.json());

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