import { pool } from '../db/pool.js';
import { createError } from '../middleware/errors.js';

const bookQuery = `
  SELECT books.id, books.title, books.author_id, authors.name AS author_name,
         books.publication_year, books.status, books.created_at, books.updated_at
  FROM books JOIN authors ON authors.id = books.author_id`;

export async function listBooks(request, response) {
  const page = Math.max(Number.parseInt(request.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(request.query.limit || '10', 10), 1), 100);
  const offset = (page - 1) * limit;
  const search = (request.query.search || '').trim();
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(books.title ILIKE $${values.length} OR authors.name ILIKE $${values.length})`);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await pool.query(`SELECT COUNT(*) FROM books JOIN authors ON authors.id = books.author_id${where}`, values);
  values.push(limit, offset);
  const result = await pool.query(`${bookQuery}${where} ORDER BY books.title LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  const total = Number.parseInt(countResult.rows[0].count, 10);

  response.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getBook(request, response) {
  const result = await pool.query(`${bookQuery} WHERE books.id = $1`, [request.params.id]);
  if (!result.rowCount) throw createError('Livre introuvable', 404);
  response.json(result.rows[0]);
}

export async function createBook(request, response) {
  const { title, authorId, publicationYear } = request.body;
  if (!title || !authorId || !publicationYear) throw createError('Le titre, l’auteur et l’année sont obligatoires');

  const result = await pool.query(
    'INSERT INTO books (title, author_id, publication_year) VALUES ($1, $2, $3) RETURNING id, title, author_id, publication_year, status',
    [title.trim(), authorId, publicationYear]
  );
  response.status(201).json(result.rows[0]);
}

export async function updateBook(request, response) {
  const { title, authorId, publicationYear } = request.body;
  if (!title || !authorId || !publicationYear) throw createError('Le titre, l’auteur et l’année sont obligatoires');

  const result = await pool.query(
    `UPDATE books SET title = $1, author_id = $2, publication_year = $3, updated_at = NOW()
     WHERE id = $4 RETURNING id, title, author_id, publication_year, status`,
    [title.trim(), authorId, publicationYear, request.params.id]
  );
  if (!result.rowCount) throw createError('Livre introuvable', 404);
  response.json(result.rows[0]);
}

export async function deleteBook(request, response) {
  const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING id', [request.params.id]);
  if (!result.rowCount) throw createError('Livre introuvable', 404);
  response.status(204).send();
}