import { pool } from '../db/pool.js';

export async function getStatistics(_request, response) {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM books) AS total_books,
      (SELECT COUNT(*) FROM members) AS total_members,
      (SELECT COUNT(*) FROM loans WHERE returned_at IS NULL) AS active_loans,
      (SELECT COUNT(*) FROM loans WHERE returned_at IS NULL AND due_at < CURRENT_DATE) AS overdue_loans,
      (SELECT json_build_object('bookId', books.id, 'title', books.title, 'loanCount', COUNT(loans.id))
       FROM books LEFT JOIN loans ON loans.book_id = books.id
       GROUP BY books.id, books.title ORDER BY COUNT(loans.id) DESC, books.title LIMIT 1) AS most_borrowed_book,
      (SELECT json_build_object('memberId', members.id, 'name', members.name, 'loanCount', COUNT(loans.id))
       FROM members LEFT JOIN loans ON loans.member_id = members.id
       GROUP BY members.id, members.name ORDER BY COUNT(loans.id) DESC, members.name LIMIT 1) AS most_active_member
  `);
  const stats = result.rows[0];
  response.json({
    totalBooks: Number(stats.total_books),
    totalMembers: Number(stats.total_members),
    activeLoans: Number(stats.active_loans),
    overdueLoans: Number(stats.overdue_loans),
    mostBorrowedBook: stats.most_borrowed_book,
    mostActiveMember: stats.most_active_member
  });
}