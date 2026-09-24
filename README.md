# API de gestion de bibliothèque

API REST développée avec Node.js, Express et PostgreSQL. Elle permet de gérer les auteurs, les adhérents, les livres, les emprunts et les statistiques.

L'interface frontend est servie par le même serveur et se consulte à l'adresse `http://localhost:3000/`.

> Pour un déploiement détaillé avec Supabase et Vercel, consulter le guide [DEPLOIEMENT_SUPABASE_VERCEL.md](DEPLOIEMENT_SUPABASE_VERCEL.md).

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

## Démarrer l'API

Dans un premier terminal :

```powershell
npm start
```

Message attendu :

```text
API bibliothèque démarrée sur le port 3000
```

Laisser ce terminal ouvert pendant les tests. Pour le développement, utiliser `npm run dev` afin d'activer le redémarrage automatique.

## Utiliser l'interface frontend

Une fois le serveur démarré, ouvrir [http://localhost:3000/](http://localhost:3000/) dans un navigateur.

L'interface permet de :

- consulter les statistiques du tableau de bord ;
- lister, rechercher, paginer et ajouter des livres ;
- afficher leur disponibilité ;
- ajouter et supprimer des auteurs et des adhérents ;
- consulter l'historique d'un adhérent ;
- enregistrer un emprunt et un retour ;
- distinguer visuellement les emprunts en cours et les emprunts en retard.

Les formulaires affichent les erreurs renvoyées par l'API, par exemple lorsqu'un livre est déjà emprunté. Toutes les données visibles dans l'interface sont chargées avec `fetch()` depuis les routes `/api/...`.

## Déployer sur Vercel

Le projet est préparé pour Vercel :

- `api/index.js` exporte l'application Express comme fonction serverless ;
- le dossier `public/` contient l'interface frontend servie comme fichier statique ;
- `vercel.json` configure la fonction Node.js ;
- PostgreSQL doit être hébergé sur une base accessible depuis Internet.

### 1. Préparer une base PostgreSQL distante

Vercel ne peut pas accéder à une base PostgreSQL installée uniquement sur un ordinateur. Créer une base distante avec un fournisseur PostgreSQL compatible, par exemple Neon, Supabase, Railway ou Render.

1. Créer un projet PostgreSQL chez le fournisseur choisi.
2. Copier la chaîne de connexion PostgreSQL fournie.
3. Ouvrir l'éditeur SQL du fournisseur.
4. Exécuter le contenu de `schema.sql` une seule fois.

La chaîne de connexion ressemble généralement à ceci :

```text
postgresql://utilisateur:mot_de_passe@hote/base?sslmode=require
```

Conserver exactement les paramètres SSL fournis par l'hébergeur. Ne jamais publier cette chaîne dans le dépôt GitHub.

### 2. Publier le projet sur GitHub

Depuis la racine du projet :

```powershell
git init
git add .
git commit -m "Prepare Vercel deployment"
git branch -M main
git remote add origin https://github.com/UTILISATEUR/NOM-DU-DEPOT.git
git push -u origin main
```

Si le dépôt Git existe déjà, effectuer seulement un commit et un push des dernières modifications.

Vérifier avant le push que `.env` n'est pas suivi par Git :

```powershell
git status
```

Le fichier `.env` doit rester ignoré.

### 3. Importer le dépôt dans Vercel

1. Aller sur [vercel.com](https://vercel.com/) et se connecter avec GitHub.
2. Cliquer sur **Add New...**, puis **Project**.
3. Importer le dépôt GitHub.
4. Laisser le framework sur **Other**.
5. Laisser la racine du projet vide, car `package.json`, `api/` et `public/` sont à la racine.
6. Ne pas ajouter de commande de build : ce projet n'a pas d'étape de compilation frontend.
7. Cliquer sur **Deploy** après avoir configuré les variables d'environnement.

### 4. Ajouter les variables d'environnement Vercel

Dans **Project Settings > Environment Variables**, ajouter :

```text
DATABASE_URL=postgresql://utilisateur:mot_de_passe@hote/base?sslmode=require
PORT=3000
```

`DATABASE_URL` est obligatoire. Ajouter la variable pour les environnements **Production**, **Preview** et **Development** selon le besoin. `PORT` n'est pas utilisé pour écouter sur Vercel, mais peut rester définie pour les lancements locaux.

Après toute modification d'une variable, redéployer le projet pour qu'elle soit prise en compte.

### 5. Vérifier le déploiement

Vercel fournit une URL de la forme :

```text
https://nom-du-projet.vercel.app
```

Tester d'abord l'API :

```powershell
Invoke-RestMethod https://nom-du-projet.vercel.app/api/health
```

Résultat attendu :

```text
status
------
ok
```

Tester ensuite une route PostgreSQL :

```powershell
Invoke-RestMethod https://nom-du-projet.vercel.app/api/statistics | ConvertTo-Json -Depth 5
```

Enfin, ouvrir l'interface dans un navigateur :

```text
https://nom-du-projet.vercel.app/
```

### 6. Tester l'application déployée

Les commandes du scénario de test local peuvent être réutilisées en remplaçant :

```text
http://localhost:3000
```

par :

```text
https://nom-du-projet.vercel.app
```

Par exemple :

```powershell
Invoke-RestMethod `
	-Uri https://nom-du-projet.vercel.app/api/authors `
	-Method Post `
	-ContentType "application/json" `
	-Body '{"name":"Victor Hugo","nationality":"Française"}'
```

### Dépannage Vercel

#### `500` sur `/api/health`

Vérifier les logs dans **Vercel > Project > Deployments > Functions**. Vérifier aussi que `api/index.js` est bien présent à la racine du projet.

#### `500` sur `/api/statistics` ou une route métier

La fonction répond mais ne peut probablement pas joindre PostgreSQL. Vérifier `DATABASE_URL`, l'accès réseau de la base et le paramètre `sslmode=require` fourni par l'hébergeur.

#### L'interface s'affiche mais les données ne se chargent pas

Tester `https://nom-du-projet.vercel.app/api/health` puis consulter l'onglet **Network** du navigateur. Le frontend utilise des URLs relatives `/api/...`, donc il doit être ouvert depuis le domaine Vercel et non depuis un fichier HTML local.

#### La base est vide après le déploiement

Vercel ne copie pas la base locale. Exécuter `schema.sql` dans la base PostgreSQL distante, puis créer les données de test avec le scénario de ce README.

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

| Méthode         | URL                        | Fonction                                      |
| ---------------- | -------------------------- | --------------------------------------------- |
| GET              | `/api/health`            | Vérifier que l'API répond                   |
| GET, POST        | `/api/authors`           | Lister ou créer un auteur                    |
| GET, PUT, DELETE | `/api/authors/:id`       | Consulter, modifier ou supprimer un auteur    |
| GET, POST        | `/api/members`           | Lister ou créer un adhérent                 |
| GET, PUT, DELETE | `/api/members/:id`       | Consulter, modifier ou supprimer un adhérent |
| GET              | `/api/members/:id/loans` | Consulter l'historique d'un adhérent         |
| GET, POST        | `/api/books`             | Lister ou créer un livre                     |
| GET, PUT, DELETE | `/api/books/:id`         | Consulter, modifier ou supprimer un livre     |
| GET, POST        | `/api/loans`             | Lister ou créer un emprunt                   |
| GET              | `/api/loans/current`     | Lister les emprunts en cours                  |
| GET              | `/api/loans/overdue`     | Lister les emprunts en retard                 |
| PATCH            | `/api/loans/:id/return`  | Enregistrer le retour d'un livre              |
| GET              | `/api/statistics`        | Consulter les statistiques                    |

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
