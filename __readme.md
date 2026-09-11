# API de gestion de bibliothèque

Backend Express connecté à PostgreSQL pour gérer les auteurs, adhérents, livres et emprunts.

## Installation

1. Installer Node.js et PostgreSQL.
2. Installer les dépendances : `npm install`
3. Créer une base PostgreSQL nommée `bibliotheque`.
4. Copier `.env.example` vers `.env` et ajuster `DATABASE_URL`.
5. Exécuter `schema.sql` sur la base.
6. Démarrer l'API : `npm start`

La route `GET /api/health` permet de vérifier que le serveur répond.

## Routes principales

- `/api/authors` : CRUD des auteurs.
- `/api/members` : CRUD des adhérents et historique des emprunts.
- `/api/books` : CRUD, recherche avec `?search=...` et pagination avec `?page=1&limit=10`.
- `/api/loans` : création, retour, emprunts en cours et retards.
- `/api/statistics` : indicateurs du tableau de bord.

Les emprunts et les changements de disponibilité d'un livre sont exécutés dans une transaction PostgreSQL.