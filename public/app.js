const state = { booksPage: 1, booksLimit: 8, loanFilter: 'current', books: [], members: [], authors: [] };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (!response.ok) { let message = `Erreur HTTP ${response.status}`; try { const body = await response.json(); message = body.error || message; } catch {} throw new Error(message); }
  return response.status === 204 ? null : response.json();
}

function showToast(message, isError = false) { const toast = $('#toast'); toast.textContent = message; toast.className = `toast is-visible${isError ? ' error' : ''}`; window.setTimeout(() => { toast.className = 'toast'; }, 3500); }
function formatDate(value) {
  if (!value) return '—';
  const rawValue = String(value);
  const dateValue = rawValue.includes('T') ? rawValue : `${rawValue}T12:00:00`;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'Date invalide' : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function isOverdue(loan) { return !loan.returned_at && new Date(`${loan.due_at}T23:59:59`) < new Date(); }
function formData(form) { return Object.fromEntries(new FormData(form)); }

async function loadDashboard() {
  const statsPromise = api('/statistics').then((stats) => {
    $('#stat-books').textContent = stats.totalBooks;
    $('#stat-members').textContent = stats.totalMembers;
    $('#stat-active').textContent = stats.activeLoans;
    $('#stat-overdue').textContent = stats.overdueLoans;
    $('#leaders').innerHTML = `<div class="leader"><strong>Livre le plus emprunté</strong><span>${stats.mostBorrowedBook ? `${escapeHtml(stats.mostBorrowedBook.title)} · ${stats.mostBorrowedBook.loanCount}` : 'Aucun prêt'}</span></div><div class="leader"><strong>Adhérent le plus actif</strong><span>${stats.mostActiveMember ? `${escapeHtml(stats.mostActiveMember.name)} · ${stats.mostActiveMember.loanCount}` : 'Aucun prêt'}</span></div>`;
  }).catch((error) => {
    $('#leaders').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    throw error;
  });
  const loansPromise = api('/loans/current').then((loans) => {
    $('#dashboard-loans').innerHTML = loans.slice(0, 5).map((loan) => `<div class="loan-item"><div class="loan-main"><strong>${escapeHtml(loan.book_title)}</strong><span>${escapeHtml(loan.member_name)} · retour ${formatDate(loan.due_at)}</span></div><span class="pill ${isOverdue(loan) ? 'overdue' : ''}">${isOverdue(loan) ? 'En retard' : 'En cours'}</span></div>`).join('') || '<div class="empty-state">Aucun emprunt en cours.</div>';
  }).catch((error) => {
    $('#dashboard-loans').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    throw error;
  });
  await Promise.allSettled([statsPromise, loansPromise]);
}

async function loadAuthors() { state.authors = await api('/authors'); $('#authors-table').innerHTML = `<table><thead><tr><th>Nom</th><th>Nationalité</th><th>Actions</th></tr></thead><tbody>${state.authors.map((author) => `<tr><td><strong>${escapeHtml(author.name)}</strong></td><td>${escapeHtml(author.nationality)}</td><td><button class="table-action danger" data-delete-author="${author.id}">Supprimer</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty-state">Aucun auteur enregistré.</td></tr>'}</tbody></table>`; $('#book-author').innerHTML = '<option value="">Choisir un auteur…</option>' + state.authors.map((author) => `<option value="${author.id}">${escapeHtml(author.name)}</option>`).join(''); }
async function loadMembers() { state.members = await api('/members'); $('#members-table').innerHTML = `<table><thead><tr><th>Nom</th><th>Contact</th><th>Actions</th></tr></thead><tbody>${state.members.map((member) => `<tr><td><strong>${escapeHtml(member.name)}</strong></td><td>${escapeHtml(member.contact)}</td><td><button class="table-action" data-history-member="${member.id}">Historique</button><button class="table-action danger" data-delete-member="${member.id}">Supprimer</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty-state">Aucun adhérent enregistré.</td></tr>'}</tbody></table>`; $('#loan-member').innerHTML = '<option value="">Choisir un adhérent…</option>' + state.members.map((member) => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join(''); }
async function loadBooks() { const search = encodeURIComponent($('#book-query').value.trim()); const result = await api(`/books?page=${state.booksPage}&limit=${state.booksLimit}${search ? `&search=${search}` : ''}`); state.books = result.data; $('#books-table').innerHTML = `<table><thead><tr><th>Ouvrage</th><th>Auteur</th><th>Année</th><th>Disponibilité</th><th>Actions</th></tr></thead><tbody>${state.books.map((book) => `<tr><td><strong>${escapeHtml(book.title)}</strong></td><td>${escapeHtml(book.author_name)}</td><td>${book.publication_year}</td><td><span class="pill ${book.status === 'borrowed' ? 'overdue' : ''}">${book.status === 'borrowed' ? 'Emprunté' : 'Disponible'}</span></td><td><button class="table-action danger" data-delete-book="${book.id}">Supprimer</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">Aucun livre trouvé.</td></tr>'}</tbody></table>`; $('#books-pagination').innerHTML = Array.from({ length: result.pagination.totalPages }, (_, index) => `<button class="${result.pagination.page === index + 1 ? 'is-active' : ''}" data-book-page="${index + 1}">${index + 1}</button>`).join(''); $('#loan-book').innerHTML = '<option value="">Choisir un livre…</option>' + state.books.filter((book) => book.status === 'available').map((book) => `<option value="${book.id}">${escapeHtml(book.title)}</option>`).join(''); }
async function loadLoans(filter = state.loanFilter) {
  state.loanFilter = filter;
  const path = filter === 'current' ? '/loans/current' : filter === 'overdue' ? '/loans/overdue' : '/loans';
  document.querySelectorAll('[data-loan-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.loanFilter === filter));
  try {
    const loans = await api(path);
    $('#loans-table').innerHTML = `<table><thead><tr><th>Livre</th><th>Adhérent</th><th>Emprunté le</th><th>Retour prévu</th><th>Statut</th><th>Action</th></tr></thead><tbody>${loans.map((loan) => `<tr><td><strong>${escapeHtml(loan.book_title)}</strong></td><td>${escapeHtml(loan.member_name)}</td><td>${formatDate(loan.borrowed_at)}</td><td>${formatDate(loan.due_at)}</td><td><span class="pill ${isOverdue(loan) ? 'overdue' : ''}">${loan.returned_at ? 'Retourné' : isOverdue(loan) ? 'En retard' : 'En cours'}</span></td><td>${!loan.returned_at ? `<button class="table-action" data-return-loan="${loan.id}">Enregistrer le retour</button>` : '—'}</td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">Aucun emprunt dans cette vue.</td></tr>'}</tbody></table>`;
  } catch (error) {
    $('#loans-table').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    throw error;
  }
}

async function refreshAll() {
  const loaders = [loadAuthors, loadMembers, loadBooks, loadLoans, loadDashboard];
  const results = await Promise.allSettled(loaders.map((loader) => loader()));
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
}
function navigate(view) { document.querySelectorAll('.view').forEach((section) => section.classList.toggle('is-visible', section.id === `${view}-view`)); document.querySelectorAll('[data-view]').forEach((link) => link.classList.toggle('is-active', link.dataset.view === view)); $('#page-title').textContent = { dashboard: 'Tableau de bord', books: 'Livres', members: 'Adhérents', loans: 'Emprunts', authors: 'Auteurs' }[view] || 'Tableau de bord'; $('.sidebar').classList.remove('is-open'); }

document.addEventListener('click', async (event) => { const viewLink = event.target.closest('[data-view]'); if (viewLink) { event.preventDefault(); location.hash = viewLink.dataset.view; navigate(viewLink.dataset.view); } const open = event.target.closest('[data-open-form]'); if (open) $(`#${open.dataset.openForm}`).classList.remove('is-hidden'); const close = event.target.closest('[data-close-form]'); if (close) $(`#${close.dataset.closeForm}`).classList.add('is-hidden'); if (event.target.closest('[data-close-history]')) $('#member-history').classList.add('is-hidden'); const page = event.target.closest('[data-book-page]'); if (page) { state.booksPage = Number(page.dataset.bookPage); loadBooks().catch((error) => showToast(error.message, true)); } const filter = event.target.closest('[data-loan-filter]'); if (filter) loadLoans(filter.dataset.loanFilter).catch((error) => showToast(error.message, true)); try { const authorId = event.target.closest('[data-delete-author]')?.dataset.deleteAuthor; if (authorId && confirm('Supprimer cet auteur ?')) { await api(`/authors/${authorId}`, { method: 'DELETE' }); await loadAuthors(); showToast('Auteur supprimé.'); } const memberId = event.target.closest('[data-delete-member]')?.dataset.deleteMember; if (memberId && confirm('Supprimer cet adhérent ?')) { await api(`/members/${memberId}`, { method: 'DELETE' }); await loadMembers(); showToast('Adhérent supprimé.'); } const bookId = event.target.closest('[data-delete-book]')?.dataset.deleteBook; if (bookId && confirm('Supprimer ce livre ?')) { await api(`/books/${bookId}`, { method: 'DELETE' }); await loadBooks(); showToast('Livre supprimé.'); } const loanId = event.target.closest('[data-return-loan]')?.dataset.returnLoan; if (loanId) { await api(`/loans/${loanId}/return`, { method: 'PATCH' }); await Promise.all([loadLoans(), loadBooks(), loadDashboard()]); showToast('Retour enregistré.'); } const historyMemberId = event.target.closest('[data-history-member]')?.dataset.historyMember; if (historyMemberId) { const member = state.members.find((item) => String(item.id) === historyMemberId); const history = await api(`/members/${historyMemberId}/loans`); $('#history-title').textContent = `Historique · ${member.name}`; $('#history-content').innerHTML = history.map((loan) => `<div class="loan-item"><div class="loan-main"><strong>${escapeHtml(loan.title)}</strong><span>Retour prévu le ${formatDate(loan.due_at)}</span></div><span class="pill ${loan.returned_at ? '' : 'overdue'}">${loan.returned_at ? 'Retourné' : 'En cours'}</span></div>`).join('') || '<div class="empty-state">Aucun emprunt enregistré.</div>'; $('#member-history').classList.remove('is-hidden'); } } catch (error) { showToast(error.message, true); } });

document.addEventListener('submit', async (event) => { event.preventDefault(); try { const data = formData(event.target); if (event.target.id === 'book-search') { state.booksPage = 1; await loadBooks(); return; } if (event.target.id === 'create-author-form') await api('/authors', { method: 'POST', body: JSON.stringify(data) }); if (event.target.id === 'create-member-form') await api('/members', { method: 'POST', body: JSON.stringify(data) }); if (event.target.id === 'create-book-form') await api('/books', { method: 'POST', body: JSON.stringify({ ...data, authorId: Number(data.authorId), publicationYear: Number(data.publicationYear) }) }); if (event.target.id === 'create-loan-form') await api('/loans', { method: 'POST', body: JSON.stringify({ ...data, memberId: Number(data.memberId), bookId: Number(data.bookId) }) }); event.target.reset(); event.target.closest('.form-panel').classList.add('is-hidden'); await refreshAll(); showToast('Opération enregistrée.'); } catch (error) { showToast(error.message, true); } });

$('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('is-open')); $('#current-date').textContent = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date());
window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'dashboard')); (async function init() { try { await api('/health'); $('#api-status').textContent = 'opérationnelle'; await refreshAll(); } catch (error) { $('#api-status').textContent = 'indisponible'; showToast(error.message, true); } navigate(location.hash.slice(1) || 'dashboard'); }());