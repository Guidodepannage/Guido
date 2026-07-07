# Guido — Mettre le projet en ligne (guide de déploiement)

Ce dossier est l'application Guido complète. Voici comment la publier.
Ordre conseillé : **A → B → C → D → E**. Reviens me voir à la moindre erreur.

> Honnêteté : c'est la partie la plus technique du parcours. Prends ton temps,
> et n'hésite pas à te faire épauler quelques heures par un développeur si un
> point bloque — la structure est prête, il n'y a « que » à assembler.

---

## A. Préparer la base (Supabase)
Dans **SQL Editor**, exécute (si ce n'est pas déjà fait) :
1. `guido-supabase-schema.sql` — les tables (déjà fait chez toi).
2. `guido-notifications.sql` — la table des abonnements push.
3. `guido-onboarding.sql` (dans ce dossier) — l'activation de compte par l'invité.

Puis récupère (Supabase → **Connect** ou **Settings → API Keys**) :
- **Project URL** (`https://xxxx.supabase.co`)
- **Publishable key** (`sb_publishable_…`)

## B. Déposer le code sur GitHub (sans ligne de commande)
1. Crée un compte sur **github.com**, puis **New repository** → nom `guido` → **Create**.
2. Sur la page du dépôt vide : **uploading an existing file**.
3. **Glisse-dépose tout le contenu de ce dossier `guido/`** (y compris les dossiers `src/` et `public/`). Ne dépose pas les clés : le fichier `.env` ne doit **pas** être envoyé (garde `.env.example` seulement).
4. **Commit changes**.

## C. Publier sur Vercel
1. Va sur **vercel.com**, connecte-toi **avec GitHub**.
2. **Add New… → Project**, sélectionne le dépôt `guido`, clique **Import**.
3. Vercel détecte **Vite** automatiquement. Avant de déployer, ouvre **Environment Variables** et ajoute :
   - `VITE_SUPABASE_URL` = ton Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = ta clé publishable
   - `VITE_VAPID_PUBLIC_KEY` = ta clé **publique** VAPID (voir étape E ; tu peux la mettre plus tard et redéployer)
4. Clique **Deploy**. Au bout d'une minute, tu obtiens une adresse `https://guido-xxxx.vercel.app`.
5. (Plus tard) tu pourras brancher ton domaine `app.guido.fr` dans **Settings → Domains**.

## D. Relier Supabase à l'app
Dans Supabase → **Authentication → URL Configuration** :
- **Site URL** = l'adresse Vercel (ou `https://app.guido.fr` une fois le domaine branché).
- **Redirect URLs** : ajoute `https://<ton-adresse>/bienvenue`.

Déploie aussi la fonction de création de comptes :
- Fichier `guido-creer-compte.ts` → à déployer en **Edge Function** nommée `creer-compte`.
- Secret à définir : `APP_URL` = ton adresse (Vercel ou domaine).

Tu peux maintenant te connecter avec ton compte **admin**, créer un compte, et copier le lien d'invitation généré. 🎉

## E. Activer les notifications (le téléphone qui sonne)
1. Génère les clés VAPID : `npx web-push generate-vapid-keys`.
2. Mets la clé **publique** dans Vercel (`VITE_VAPID_PUBLIC_KEY`) et redéploie.
3. Déploie l'Edge Function `guido-send-mission-push.ts` (nom : `send-mission-push`) et ses secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
4. Supabase → **Database → Webhooks** : nouveau webhook sur la table `missions`, événement **Update**, qui appelle la fonction `send-mission-push`.
5. Sur le téléphone d'un prestataire : ouvre l'app, **Ajouter à l'écran d'accueil**, connecte-toi, appuie sur **« Activer les alertes »**. Depuis la console admin, assigne-lui une mission → **son téléphone sonne**.

---

## En résumé, ce que TOI tu fournis
- Le dépôt GitHub (glisser-déposer les fichiers).
- Les variables d'environnement sur Vercel (URL + clés).
- Les URLs de redirection et le déploiement des 2 Edge Functions sur Supabase.
- Deux icônes `icon-192.png` et `icon-512.png` à placer dans `public/` (le logo Guido).

## Test rapide, une fois en ligne
1. Connexion **admin** → crée un client et un prestataire → copie/envoie les liens.
2. Ouvre chaque lien (autre navigateur / téléphone) → définis un mot de passe.
3. **Client** : envoie une demande. **Admin** : assigne-la. **Prestataire** : reçois l'alerte, valide, termine. **Client** : suis les 3 étapes.

À la moindre erreur (page blanche, message rouge, souci de déploiement), note ce que tu vois et reviens me le dire : on débogue ensemble.
