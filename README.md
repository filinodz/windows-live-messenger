# Windows Live Messenger — édition nostalgie française

Une reconstitution web de Windows Live Messenger, entièrement francisée et équipée d’un vrai mode en ligne : comptes, contacts, invitations, présence, conversations, émoticônes, clins d’œil et wizz.

> Fork de [clrgia/windows-live-messenger](https://github.com/clrgia/windows-live-messenger). Cette version remplace la connexion Discord par une authentification propre (e-mail + mot de passe) adossée à une API Laravel/MySQL, et retravaille l’interface.

## Ce qui change par rapport au projet d’origine

- **Authentification maison** : inscription et connexion par e-mail et mot de passe (hachage bcrypt côté serveur, token bearer). La connexion Discord (`discordAuth.js`, `auth.js`) est retirée.
- **Backend Laravel/MySQL** fourni dans [`backend/laravel`](backend/laravel) : profils, contacts, invitations, messages et wizz.
- **Vrais contacts** : ajout par adresse e-mail (`AddContactModal`), invitations à accepter ou refuser (`Invitations`), présence en ligne automatique.
- **Interface retravaillée** : page de connexion, liste de contacts, fenêtre de conversation, options et changement d’image/scène revus ; textes en français.
- **Déploiement dans un sous-dossier** (`/wlm/`) avec `.htaccess` pour Apache/cPanel.

## Architecture

```
Front React (Vite)  ──fetch──▶  API Laravel  /api/wlm/*  ──▶  MySQL
src/lib/api.js                  backend/laravel/
```

`src/lib/supabase.js` est un petit adaptateur qui expose l’ancienne surface « Supabase » utilisée par les pages, mais qui appelle en réalité l’API Laravel. Le fichier `supabase/schema.sql` est conservé pour référence si vous préférez revenir à Supabase.

## Lancer le projet

1. Installez le backend dans un projet Laravel (voir [`backend/laravel/README.md`](backend/laravel/README.md)).
2. Indiquez l’URL de l’API dans `index.html` :

   ```html
   <script>window.__WLM_API = '/api/wlm';</script>
   ```

   En développement, si l’API tourne sur un autre port, ajoutez un proxy `server.proxy` dans `vite.config.js` ou activez CORS côté Laravel.

3. Démarrez le front :

   ```bash
   npm install
   npm run dev
   ```

## Déployer

Le build est configuré pour être servi sous `/wlm/` (`base` dans `vite.config.js`, `RewriteBase` dans `public/.htaccess`). Adaptez ces deux valeurs si vous déployez ailleurs.

```bash
npm run build
```

Envoyez ensuite tout le contenu de `dist/` (y compris le fichier caché `.htaccess`) dans le dossier web correspondant.

## Réponses automatiques (optionnel)

`src/utils/openai.js` peut faire répondre un contact par l’API OpenAI via `VITE_OPENAI_API_KEY`. Attention : toute variable `VITE_*` est incluse dans le JavaScript envoyé au navigateur. N’utilisez pas de clé de production côté front ; passez plutôt par votre backend.

## À savoir

Les appels audio/vidéo, les transferts de fichiers et les jeux sont affichés pour restituer l’interface d’époque, mais restent volontairement désactivés. Les messages sont récupérés par polling (pas de WebSocket).

## Crédits

Projet original par [clrgia](https://github.com/clrgia/windows-live-messenger). Authentification, backend et refonte de l’interface par [filinodz](https://github.com/filinodz).
