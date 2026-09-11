import { pool } from '../db/pool.js';
import { createError } from '../middleware/errors.js';

export async function listMembers(_request, response) {
  const result = await pool.query('SELECT id, name, contact, created_at, updated_at FROM members ORDER BY name');
  response.json(result.rows);
}

export async function getMember(request, response) {
  const result = await pool.query('SELECT id, name, contact, created_at, updated_at FROM members WHERE id = $1', [request.params.id]);
  if (!result.rowCount) throw createError('Adhérent introuvable', 404);
  response.json(result.rows[0]);
}

export async function createMember(request, response) {
  const { name, contact } = request.body;
  if (!name || !contact) throw createError('Le nom et le contact sont obligatoires');

  const result = await pool.query(
    'INSERT INTO members (name, contact) VALUES ($1, $2) RETURNING id, name, contact, created_at, updated_at',
    [name.trim(), contact.trim()]
  );
  response.status(201).json(result.rows[0]);
}

export async function updateMember(request, response) {
  const { name, contact } = request.body;
  if (!name || !contact) throw createError('Le nom et le contact sont obligatoires');

  const result = await pool.query(
    'UPDATE members SET name = $1, contact = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, contact, created_at, updated_at',
    [name.trim(), contact.trim(), request.params.id]
  );
  if (!result.rowCount) throw createError('Adhérent introuvable', 404);
  response.json(result.rows[0]);
}

export async function deleteMember(request, response) {
  const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING id', [request.params.id]);
  if (!result.rowCount) throw createError('Adhérent introuvable', 404);
  response.status(204).send();
}

export async function memberHistory(request, response) {
  const result = await pool.query(
    `SELECT loans.id, loans.book_id, books.title, loans.borrowed_at, loans.due_at, loans.returned_at
     FROM loans JOIN books ON books.id = loans.book_id
     WHERE loans.member_id = $1 ORDER BY loans.borrowed_at DESC`,
    [request.params.id]
  );
  response.json(result.rows);
}