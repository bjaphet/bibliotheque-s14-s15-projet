# Déployer la bibliothèque avec Supabase et Vercel

Ce guide explique comment mettre en ligne l'application complète :

- base de données PostgreSQL avec Supabase ;
- API Express avec Vercel Functions ;
- interface HTML/CSS/JavaScript servie par Vercel.

Le résultat final sera accessible depuis une seule URL :

```text
https://nom-du-projet.vercel.app
```

## Vue d'ensemble

```text
Navigateur
    |
    | https://nom-du-projet.vercel.app
    v
Vercel
    |-- public/       -> interface frontend
    |-- api/index.js  -> API Express serverless
    |
    v
Supabase PostgreSQL
```

## Avant de commencer

Il faut disposer de :

- un compte [Supabase](https://supabase.com/) ;
- un compte [Vercel](https://vercel.com/) ;
- un dépôt GitHub contenant le projet ;
- Node.js installé sur l'ordinateur pour les tests locaux.

Dans le projet, les fichiers suivants sont déjà prévus pour le déploiement :

- `schema.sql` : création des tables PostgreSQL ;
- `api/index.js` : point d'entrée de l'API pour Vercel ;
- `vercel.json` : configuration Vercel ;
- `public/` : frontend ;
- `.env.example` : exemple de configuration locale.

## Partie 1 : créer la base Supabase

### 1. Créer un projet Supabase

1. Ouvrir [supabase.com](https://supabase.com/).
2. Cliquer sur **Start your project** ou **New project**.
3. Choisir une organisation ou en créer une.
4. Cliquer sur **New project**.
5. Renseigner :
   - **Name** : `bibliotheque` ;
   - **Database Password** : créer un mot de passe fort et le conserver ;
   - **Region** : choisir la région la plus proche des utilisateurs ou de Vercel.
6. Cliquer sur **Create new project**.
7. Attendre que le projet soit complètement créé.

Le mot de passe de la base ne doit jamais être publié dans GitHub ni placé dans un fichier frontend.

### 2. Ouvrir l'éditeur SQL

Dans le projet Supabase :

1. Dans le menu de gauche, cliquer sur **SQL Editor**.
2. Cliquer sur **New query**.
3. Dans VS Code, ouvrir le fichier `schema.sql`.
4. Copier tout le contenu de `schema.sql`.
5. Coller le contenu dans la requête Supabase.
6. Cliquer sur **Run** ou utiliser `Ctrl + Enter`.

Le script doit s'exécuter sans erreur.

### 3. Vérifier les tables

Dans Supabase :

1. Ouvrir **Table Editor** dans le menu de gauche.
2. Vérifier la présence des tables :
   - `authors` ;
   - `members` ;
   - `books` ;
   - `loans`.
3. Ouvrir chaque table pour vérifier sa structure.

Le script crée également :

- le type `book_status` avec les valeurs `available` et `borrowed` ;
- les clés étrangères entre les tables ;
- l'index qui empêche deux emprunts actifs pour le même livre.

### 4. Ajouter des données de test dans Supabase

Il n'est pas obligatoire d'ajouter les données à la main. Le frontend ou les commandes PowerShell de ce projet peuvent les créer via l'API.

Pour ajouter une première donnée rapidement, ouvrir **SQL Editor** et exécuter :

```sql
INSERT INTO authors (name, nationality)
VALUES ('Victor Hugo', 'Française');

INSERT INTO members (name, contact)
VALUES ('Alice Dupont', 'alice@example.com');
```

Pour les livres, il faut utiliser l'identifiant réel de l'auteur. Vérifier d'abord :

```sql
SELECT * FROM authors;
SELECT * FROM members;
```

Il est recommandé de créer les livres et les emprunts avec l'interface après le déploiement, afin de tester l'API de bout en bout.

## Partie 2 : récupérer l'adresse PostgreSQL Supabase

### Méthode recommandée pour Vercel

1. Dans Supabase, ouvrir **Project Settings**.
2. Ouvrir **Database**.
3. Chercher la section **Connection string**.
4. Sélectionner l'onglet **URI**.
5. Sélectionner le mode **Transaction pooler** si Supabase le propose.
6. Copier l'URI PostgreSQL.

Choisir impérativement l'URI **Transaction pooler** pour cette application. Ne pas utiliser l'URI directe qui commence par `db.PROJECT_REF.supabase.co:5432` si le réseau local ou l'hébergeur ne prend pas en charge IPv6.

Elle ressemble à ceci :

```text
postgresql://postgres.PROJECT_REF:VOTRE_MOT_DE_PASSE@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
```

Remplacer le mot de passe encodé ou le placeholder fourni par Supabase avec le mot de passe réel de la base.

### Important pour le mot de passe

Si le mot de passe contient des caractères spéciaux comme `@`, `#`, `/`, `:` ou `%`, il doit être encodé dans l'URL. Par exemple :

```text
@ devient %40
# devient %23
```

Le plus sûr est d'utiliser le bouton de copie de Supabase et de ne pas reconstruire l'URL manuellement.

### Tester la connexion en local

Créer ou modifier le fichier `.env` à la racine du projet :

```env
PORT=3000
DATABASE_URL=postgresql://...la-chaine-copiee-de-supabase...
```

Ne jamais ajouter `.env` à GitHub. Le fichier `.gitignore` du projet l'exclut déjà.

Démarrer l'application :

```powershell
npm install
npm start
```

Dans un deuxième terminal, tester :

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/statistics | ConvertTo-Json -Depth 5
```

Résultats attendus :

- `/api/health` retourne `status: ok` ;
- `/api/statistics` retourne un objet JSON avec les compteurs de la base Supabase.

Si `/api/health` fonctionne mais `/api/statistics` renvoie une erreur, vérifier la chaîne `DATABASE_URL` et l'exécution de `schema.sql`.

### Erreur `getaddrinfo ENOENT db....supabase.co`

Cette erreur signifie que Node.js n'arrive pas à joindre le nom d'hôte PostgreSQL direct. Dans ce projet, elle se produit généralement quand l'URI directe Supabase est utilisée alors que le réseau ne gère pas IPv6.

Dans Supabase, récupérer à nouveau la chaîne depuis **Project Settings > Database > Connection string > URI > Transaction pooler**, puis remplacer entièrement `DATABASE_URL` dans `.env`.

La valeur doit ressembler à ceci, avec les valeurs exactes fournies par Supabase :

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
```

Ne pas mettre le mot de passe entre crochets. Si le mot de passe contient `@`, il doit être encodé en `%40`; le bouton **Copy** de Supabase fournit normalement une valeur déjà correcte. Ne conserver dans `.env` qu'une seule ligne `DATABASE_URL`.

Après modification de `.env`, arrêter puis relancer le serveur :

```powershell
npm start
```

Tester ensuite :

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/statistics | ConvertTo-Json -Depth 5
```

Si un vrai mot de passe a été partagé dans un terminal, une capture ou un message, le réinitialiser dans Supabase via **Project Settings > Database > Reset database password**, puis remplacer `DATABASE_URL` avec la nouvelle chaîne.

## Partie 3 : envoyer le projet sur GitHub

Depuis la racine du projet :

```powershell
git status
git add .
git commit -m "Prepare Supabase and Vercel deployment"
git push
```

Si le dépôt distant n'est pas encore configuré :

```powershell
git init
git branch -M main
git remote add origin https://github.com/UTILISATEUR/NOM-DU-DEPOT.git
git add .
git commit -m "Initial library application"
git push -u origin main
```

Avant le push, contrôler que les fichiers secrets sont absents :

```powershell
git status --ignored
```

Les éléments suivants ne doivent pas être publiés :

```text
.env
node_modules/
.vercel/
*.log
```

Le fichier `.env.example` peut être publié, car il ne contient pas de vrai mot de passe.

## Partie 4 : déployer sur Vercel

### 1. Importer le dépôt

1. Ouvrir [vercel.com](https://vercel.com/).
2. Se connecter avec GitHub.
3. Cliquer sur **Add New...**.
4. Cliquer sur **Project**.
5. Sélectionner le dépôt GitHub.
6. Cliquer sur **Import**.

### 2. Régler le projet

Dans l'écran de configuration :

- **Framework Preset** : `Other` ;
- **Root Directory** : laisser la racine du dépôt ;
- **Build Command** : laisser vide ;
- **Output Directory** : laisser vide ;
- **Install Command** : laisser la valeur automatique `npm install`.

Ne pas choisir le dossier `public` comme racine. Le dossier `public` contient les fichiers frontend, mais `package.json` et `api/index.js` doivent rester visibles depuis la racine du projet.

### 3. Ajouter les variables d'environnement

Avant de cliquer sur **Deploy**, ouvrir **Environment Variables** et ajouter :

| Nom              | Valeur                  | Environnements                          |
| ---------------- | ----------------------- | --------------------------------------- |
| `DATABASE_URL` | URI PostgreSQL Supabase | Production, Preview, Development        |
| `PORT`         | `3000`                | Development, éventuellement Production |

Pour `DATABASE_URL`, coller l'URI Supabase complète, avec son paramètre SSL :

```text
postgresql://...@...pooler.supabase.com:6543/postgres?sslmode=require
```

`DATABASE_URL` est une variable secrète. Elle ne doit pas être préfixée par `NEXT_PUBLIC_` ou rendue accessible au navigateur.

Cliquer ensuite sur **Deploy**.

## Partie 5 : vérifier le déploiement

Vercel fournit une URL, par exemple :

```text
https://bibliotheque-xxx.vercel.app
```

### 1. Vérifier l'API

Dans PowerShell :

```powershell
$URL = "https://bibliotheque-xxx.vercel.app"
Invoke-RestMethod "$URL/api/health"
```

Résultat attendu :

```text
status
------
ok
```

### 2. Vérifier la connexion Supabase

```powershell
Invoke-RestMethod "$URL/api/statistics" | ConvertTo-Json -Depth 5
```

Cette commande confirme à la fois :

- que Vercel exécute la fonction Express ;
- que la fonction atteint Supabase ;
- que les tables ont bien été créées.

### 3. Ouvrir l'interface

Ouvrir dans le navigateur :

```text
https://bibliotheque-xxx.vercel.app/
```

Le frontend appelle automatiquement les routes relatives :

```text
/api/authors
/api/members
/api/books
/api/loans
/api/statistics
```

Aucune URL locale ne doit être écrite dans `public/app.js`.

## Partie 6 : créer les données avec l'application en ligne

Après le déploiement :

1. Ouvrir la page Vercel.
2. Aller dans **Auteurs** et créer un auteur.
3. Aller dans **Adhérents** et créer un adhérent.
4. Aller dans **Livres** et créer un livre associé à l'auteur.
5. Aller dans **Emprunts** et créer un emprunt.
6. Vérifier que le livre devient `Emprunté`.
7. Enregistrer le retour et vérifier que le livre redevient `Disponible`.
8. Vérifier les compteurs dans le tableau de bord.

Pour vérifier que les données sont bien dans Supabase, ouvrir **Table Editor** et consulter les tables concernées.

## Erreurs fréquentes

### `500` sur `/api/health`

Vérifier :

- que `api/index.js` est bien à la racine ;
- que le dernier déploiement Vercel est terminé ;
- les logs dans **Vercel > Deployments > Functions**.

### `/api/health` fonctionne mais `/api/statistics` renvoie `500`

La fonction Vercel fonctionne, mais la connexion PostgreSQL échoue. Vérifier :

- le nom exact de la variable `DATABASE_URL` ;
- le mot de passe Supabase ;
- l'utilisation de l'URI **Transaction pooler** ;
- la présence de `?sslmode=require` ;
- l'exécution complète de `schema.sql`.

### `relation "authors" does not exist`

Le schéma n'a pas été exécuté dans le bon projet Supabase. Ouvrir SQL Editor dans le projet utilisé par `DATABASE_URL`, puis exécuter `schema.sql`.

### Les changements de variables ne sont pas visibles

Après avoir modifié une variable Vercel :

1. aller dans **Deployments** ;
2. ouvrir le menu du dernier déploiement ;
3. choisir **Redeploy**.

### La page s'affiche mais les données ne se chargent pas

Tester dans cet ordre :

```powershell
Invoke-WebRequest "$URL/"
Invoke-RestMethod "$URL/api/health"
Invoke-RestMethod "$URL/api/statistics"
```

Puis ouvrir les outils développeur du navigateur et consulter **Network**. Les requêtes doivent partir vers le même domaine Vercel, sous `/api/...`.

### La base locale n'apparaît pas sur Supabase

C'est normal : Vercel et Supabase ne copient pas automatiquement PostgreSQL local. Il faut exécuter `schema.sql` dans Supabase et utiliser la nouvelle `DATABASE_URL` dans Vercel.

## Résumé très court

```text
1. Créer un projet Supabase.
2. Supabase > SQL Editor > exécuter schema.sql.
3. Supabase > Project Settings > Database > copier l'URI pooler.
4. Publier le projet sur GitHub.
5. Importer GitHub dans Vercel.
6. Ajouter DATABASE_URL dans Vercel.
7. Déployer.
8. Tester /api/health puis /api/statistics.
9. Ouvrir l'URL Vercel.
```
