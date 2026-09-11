import { pool } from '../db/pool.js';
import { createError } from '../middleware/errors.js';

export async function listAuthors(_request, response) {
  const result = await pool.query('SELECT id, name, nationality, created_at, updated_at FROM authors ORDER BY name');
  response.json(result.rows);
}

export async function getAuthor(request, response) {
  const result = await pool.query('SELECT id, name, nationality, created_at, updated_at FROM authors WHERE id = $1', [request.params.id]);
  if (!result.rowCount) throw createError('Auteur introuvable', 404);
  response.json(result.rows[0]);
}

export async function createAuthor(request, response) {
  const { name, nationality } = request.body;
  if (!name || !nationality) throw createError('Le nom et la nationalité sont obligatoires');

  const result = await pool.query(
    'INSERT INTO authors (name, nationality) VALUES ($1, $2) RETURNING id, name, nationality, created_at, updated_at',
    [name.trim(), nationality.trim()]
  );
  response.status(201).json(result.rows[0]);
}

export async function updateAuthor(request, response) {
  const { name, nationality } = request.body;
  if (!name || !nationality) throw createError('Le nom et la nationalité sont obligatoires');

  const result = await pool.query(
    'UPDATE authors SET name = $1, nationality = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, nationality, created_at, updated_at',
    [name.trim(), nationality.trim(), request.params.id]
  );
  if (!result.rowCount) throw createError('Auteur introuvable', 404);
  response.json(result.rows[0]);
}

export async function deleteAuthor(request, response) {
  const result = await pool.query('DELETE FROM authors WHERE id = $1 RETURNING id', [request.params.id]);
  if (!result.rowCount) throw createError('Auteur introuvable', 404);
  response.status(204).send();
}