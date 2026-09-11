-- table des auteurs
CREATE TABLE authors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table de membres
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table des livres, avec une contrainte pour l'année de publication et un statut de disponibilité
CREATE TYPE book_status AS ENUM ('available', 'borrowed');

-- table des livres 
CREATE TABLE books (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  publication_year INTEGER NOT NULL CHECK (publication_year BETWEEN 0 AND EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  status book_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table des emprunts, avec une contrainte pour la date de retour
CREATE TABLE loans (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);

-- index pour s'assurer qu'un livre ne peut être emprunté qu'une seule fois à la fois
CREATE UNIQUE INDEX one_active_loan_per_book
  ON loans (book_id)
  WHERE returned_at IS NULL;

-- index pour les recherches textuelles sur les titres de livres et les noms d'auteurs
CREATE INDEX books_title_search ON books USING GIN (to_tsvector('simple', title));

-- index pour les recherches textuelles sur les noms d'auteurs
CREATE INDEX authors_name_search ON authors USING GIN (to_tsvector('simple', name));

-- index pour les recherches textuelles sur les noms de membres
CREATE INDEX loans_due_at ON loans (due_at) WHERE returned_at IS NULL;