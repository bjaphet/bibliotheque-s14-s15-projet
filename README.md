# API de gestion de bibliothèque

API REST développée avec Node.js, Express et PostgreSQL. Elle permet de gérer les auteurs, les adhérents, les livres, les emprunts et les statistiques.

## Prérequis

- Node.js installé.
- PostgreSQL installé et démarré.
- PowerShell, Postman ou un autre client HTTP.

Vérifier Node.js :

```powershell
node --version
npm --version
```

## Installation du projet

Depuis le dossier du projet :

```powershell
cd "C:\Users\ACER\Downloads\Akieni Academy\S14-S15"
npm install
```

## Configuration de PostgreSQL

### Créer la base avec pgAdmin

1. Ouvrir **pgAdmin 4**.
2. Ouvrir `Servers > PostgreSQL > Databases`.
3. Cliquer droit sur `Databases`, puis choisir `Create > Database`.
4. Nommer la base `bibliotheque`.
5. Ouvrir `Tools > Query Tool` sur cette base.
6. Ouvrir le fichier `schema.sql`.
7. Copier son contenu dans Query Tool et exécuter avec `F5`.

Le script crée les tables `authors`, `members`, `books` et `loans`, ainsi que les contraintes nécessaires aux emprunts.

### Configurer la connexion

Créer un fichier `.env` à la racine du projet, à côté de `.env.example` :

```env
PORT=3000
DATABASE_URL=postgresql://postgres:MOT_DE_PASSE@localhost:5432/bibliotheque
```

Remplacer `MOT_DE_PASSE` par le mot de passe du serveur PostgreSQL.

Ne jamais partager le fichier `.env`. Il est exclu de Git par `.gitignore`.

## Démarrer l'API

Dans un premier terminal :

```powershell
cd "C:\Users\ACER\Downloads\Akieni Academy\S14-S15"
npm start
```

Message attendu :

```text
API bibliothèque démarrée sur le port 3000
```

Laisser ce terminal ouvert pendant les tests. Pour le développement, utiliser `npm run dev` afin d'activer le redémarrage automatique.

## Vérifier que le serveur répond

Dans un deuxième terminal PowerShell :

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Résultat attendu :

```text
status
------
ok
```

Cette route vérifie Express. Les routes suivantes vérifient également la connexion à PostgreSQL.

## Scénario de test complet avec PowerShell

Les commandes suivantes créent leurs propres données de test. Elles enregistrent les IDs retournés par l'API : il ne faut donc pas supposer que les IDs valent `1`.

### 1. Créer un auteur

```powershell
$author = Invoke-RestMethod `
	-Uri http://localhost:3000/api/authors `
	-Method Post `
	-ContentType "application/json" `
	-Body '{"name":"Victor Hugo","nationality":"Française"}'

$author | ConvertTo-Json
```

### 2. Créer un adhérent

```powershell
$member = Invoke-RestMethod `
	-Uri http://localhost:3000/api/members `
	-Method Post `
	-ContentType "application/json" `
	-Body '{"name":"Alice Dupont","contact":"alice@example.com"}'

$member | ConvertTo-Json
```

### 3. Créer deux livres

Le premier sera utilisé pour tester un emprunt en cours. Le second permettra de tester un emprunt en retard.

```powershell
$bookCurrent = Invoke-RestMethod `
	-Uri http://localhost:3000/api/books `
	-Method Post `
	-ContentType "application/json" `
	-Body (@{
		title = "Les Misérables"
		authorId = $author.id
		publicationYear = 1862
	} | ConvertTo-Json)

$bookOverdue = Invoke-RestMethod `
	-Uri http://localhost:3000/api/books `
	-Method Post `
	-ContentType "application/json" `
	-Body (@{
		title = "Notre-Dame de Paris"
		authorId = $author.id
		publicationYear = 1831
	} | ConvertTo-Json)

$bookCurrent | ConvertTo-Json
$bookOverdue | ConvertTo-Json
```

### 4. Tester la liste, la recherche et la pagination

```powershell
Invoke-RestMethod http://localhost:3000/api/authors | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/members | ConvertTo-Json
Invoke-RestMethod "http://localhost:3000/api/books?search=Victor&page=1&limit=10" | ConvertTo-Json -Depth 5
```

### 5. Créer un emprunt en cours

```powershell
$currentLoan = Invoke-RestMethod `
	-Uri http://localhost:3000/api/loans `
	-Method Post `
	-ContentType "application/json" `
	-Body (@{
		memberId = $member.id
		bookId = $bookCurrent.id
		dueAt = "2099-12-31"
	} | ConvertTo-Json)

$currentLoan | ConvertTo-Json
```

Le livre doit maintenant avoir le statut `borrowed` :

```powershell
Invoke-RestMethod "http://localhost:3000/api/books/$($bookCurrent.id)" | ConvertTo-Json
```

### 6. Créer un emprunt en retard

```powershell
$overdueLoan = Invoke-RestMethod `
	-Uri http://localhost:3000/api/loans `
	-Method Post `
	-ContentType "application/json" `
	-Body (@{
		memberId = $member.id
		bookId = $bookOverdue.id
		dueAt = "2020-01-01"
	} | ConvertTo-Json)

$overdueLoan | ConvertTo-Json
```

### 7. Consulter les emprunts

```powershell
Invoke-RestMethod http://localhost:3000/api/loans | ConvertTo-Json -Depth 5
Invoke-RestMethod http://localhost:3000/api/loans/current | ConvertTo-Json -Depth 5
Invoke-RestMethod http://localhost:3000/api/loans/overdue | ConvertTo-Json -Depth 5
```

L'emprunt concernant `Notre-Dame de Paris` doit apparaître dans la liste des retards.

### 8. Vérifier le refus d'un double emprunt

Cette commande réutilise le premier livre, déjà emprunté :

```powershell
Invoke-RestMethod `
	-Uri http://localhost:3000/api/loans `
	-Method Post `
	-ContentType "application/json" `
	-Body (@{
		memberId = $member.id
		bookId = $bookCurrent.id
		dueAt = "2099-12-31"
	} | ConvertTo-Json)
```

Résultat attendu : une erreur HTTP `409` avec le message `Le livre est déjà emprunté`.

### 9. Retourner le premier livre

```powershell
$returnedLoan = Invoke-RestMethod `
	-Uri "http://localhost:3000/api/loans/$($currentLoan.id)/return" `
	-Method Patch

$returnedLoan | ConvertTo-Json
Invoke-RestMethod "http://localhost:3000/api/books/$($bookCurrent.id)" | ConvertTo-Json
```

Le statut du premier livre doit redevenir `available`.

### 10. Consulter les statistiques

```powershell
Invoke-RestMethod http://localhost:3000/api/statistics | ConvertTo-Json -Depth 5
```

La réponse contient le nombre de livres, d'adhérents, d'emprunts en cours, d'emprunts en retard, le livre le plus emprunté et l'adhérent le plus actif.

## Routes disponibles

| Méthode | URL | Fonction |
| --- | --- | --- |
| GET | `/api/health` | Vérifier que l'API répond |
| GET, POST | `/api/authors` | Lister ou créer un auteur |
| GET, PUT, DELETE | `/api/authors/:id` | Consulter, modifier ou supprimer un auteur |
| GET, POST | `/api/members` | Lister ou créer un adhérent |
| GET, PUT, DELETE | `/api/members/:id` | Consulter, modifier ou supprimer un adhérent |
| GET | `/api/members/:id/loans` | Consulter l'historique d'un adhérent |
| GET, POST | `/api/books` | Lister ou créer un livre |
| GET, PUT, DELETE | `/api/books/:id` | Consulter, modifier ou supprimer un livre |
| GET, POST | `/api/loans` | Lister ou créer un emprunt |
| GET | `/api/loans/current` | Lister les emprunts en cours |
| GET | `/api/loans/overdue` | Lister les emprunts en retard |
| PATCH | `/api/loans/:id/return` | Enregistrer le retour d'un livre |
| GET | `/api/statistics` | Consulter les statistiques |

## Réinitialiser la base de test

Attention : cette opération supprime les tables et toutes les données de la base `bibliotheque`.

Dans pgAdmin, ouvre Query Tool sur la base puis exécute :

```sql
DROP TABLE IF EXISTS loans, books, members, authors CASCADE;
DROP TYPE IF EXISTS book_status CASCADE;
```

Ensuite, réexécute tout le contenu de `schema.sql`.

## Dépannage

### `ECONNREFUSED`

Le serveur Express n'est pas démarré ou n'écoute pas sur le port `3000`. Lancer :

```powershell
npm start
```

### `password authentication failed`

Le mot de passe PostgreSQL dans `.env` est incorrect.

### `database "bibliotheque" does not exist`

La base n'a pas encore été créée dans PostgreSQL.

### `relation "authors" does not exist`

Le script `schema.sql` n'a pas été exécuté sur la base `bibliotheque`.

### `$author n'est pas reconnu`

La commande a été exécutée dans CMD au lieu de PowerShell. Ouvrir un terminal PowerShell ou utiliser `curl`.

## Vérification du code

Pour vérifier la syntaxe JavaScript :

```powershell
Get-ChildItem src -Recurse -Filter *.js | ForEach-Object {
	node --check $_.FullName
}
```

## Choix techniques

- Les données sont séparées en quatre tables relationnelles.
- Les clés étrangères protègent les relations entre auteurs, livres, adhérents et emprunts.
- Un index PostgreSQL partiel interdit deux emprunts actifs pour le même livre.
- La création et le retour d'un emprunt utilisent une transaction SQL.
- Les requêtes SQL utilisent des paramètres afin d'éviter les injections SQL.
- Les routes, contrôleurs, middlewares et accès à la base sont séparés pour faciliter la maintenance.