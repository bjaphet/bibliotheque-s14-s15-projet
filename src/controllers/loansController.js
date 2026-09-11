import { pool } from '../db/pool.js';
import { createError } from '../middleware/errors.js';

const loanQuery = `
  SELECT loans.id, loans.member_id, members.name AS member_name, loans.book_id,
         books.title AS book_title, loans.borrowed_at, loans.due_at, loans.returned_at
  FROM loans
  JOIN members ON members.id = loans.member_id
  JOIN books ON books.id = loans.book_id`;

  // Lister tous les emprunts
export async function listLoans(_request, response) {
  const result = await pool.query(`${loanQuery} ORDER BY loans.borrowed_at DESC`);
  response.json(result.rows);
}

// Lister les emprunts en cours
export async function currentLoans(_request, response) {
  const result = await pool.query(`${loanQuery} WHERE loans.returned_at IS NULL ORDER BY loans.due_at`);
  response.json(result.rows);
}

// Lister les emprunts en retard
export async function overdueLoans(_request, response) {
  const result = await pool.query(`${loanQuery} WHERE loans.returned_at IS NULL AND loans.due_at < CURRENT_DATE ORDER BY loans.due_at`);
  response.json(result.rows);
}

// Créer un nouvel emprunt
export async function createLoan(request, response) {
  const { memberId, bookId, dueAt } = request.body;
  if (!memberId || !bookId || !dueAt) throw createError('L’adhérent, le livre et la date de retour sont obligatoires');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookResult = await client.query('SELECT id, status FROM books WHERE id = $1 FOR UPDATE', [bookId]);
    if (!bookResult.rowCount) throw createError('Livre introuvable', 404);
    if (bookResult.rows[0].status !== 'available') throw createError('Le livre est déjà emprunté', 409);

    const memberResult = await client.query('SELECT id FROM members WHERE id = $1', [memberId]);
    if (!memberResult.rowCount) throw createError('Adhérent introuvable', 404);

    const loanResult = await client.query(
      'INSERT INTO loans (member_id, book_id, due_at) VALUES ($1, $2, $3) RETURNING id, member_id, book_id, borrowed_at, due_at, returned_at',
      [memberId, bookId, dueAt]
    );
    await client.query("UPDATE books SET status = 'borrowed', updated_at = NOW() WHERE id = $1", [bookId]);
    await client.query('COMMIT');
    response.status(201).json(loanResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Retourner un livre emprunté
export async function returnLoan(request, response) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loanResult = await client.query('SELECT id, book_id, returned_at FROM loans WHERE id = $1 FOR UPDATE', [request.params.id]);
    if (!loanResult.rowCount) throw createError('Emprunt introuvable', 404);
    if (loanResult.rows[0].returned_at) throw createError('Cet emprunt est déjà retourné', 409);

    const result = await client.query(
      'UPDATE loans SET returned_at = NOW() WHERE id = $1 RETURNING id, member_id, book_id, borrowed_at, due_at, returned_at',
      [request.params.id]
    );
    await client.query("UPDATE books SET status = 'available', updated_at = NOW() WHERE id = $1", [loanResult.rows[0].book_id]);
    await client.query('COMMIT');
    response.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}