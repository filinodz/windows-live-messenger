# Backend Laravel / MySQL

API utilisée par le front pour les comptes, les contacts, les invitations et les messages. Elle remplace la connexion Discord d’origine par une authentification e-mail + mot de passe avec token bearer.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `app/Http/Controllers/Api/WlmController.php` | Inscription, connexion, profil, contacts, invitations, messages |
| `app/Models/WlmProfile.php` | Compte du messager (mot de passe haché, token d’API) |
| `app/Models/WlmFriendship.php` | Invitation / relation de contact |
| `app/Models/WlmMessage.php` | Message texte ou wizz |
| `database/migrations/…_create_wlm_tables.php` | Tables `wlm_profiles`, `wlm_friendships`, `wlm_messages` |
| `routes/wlm.php` | Routes à ajouter dans `routes/api.php` |

## Installation dans un projet Laravel (10+)

1. Copiez `app/` et `database/` dans votre projet Laravel.
2. Collez le contenu de `routes/wlm.php` dans `routes/api.php`.
3. Lancez la migration :

   ```bash
   php artisan migrate
   ```

4. Côté front, indiquez l’URL de l’API dans `index.html` :

   ```html
   <script>window.__WLM_API = '/api/wlm';</script>
   ```

   Si l’API est sur un autre domaine, activez CORS pour l’origine du front dans `config/cors.php`.

## Endpoints

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/register` | Créer un compte → `{ token, profile }` |
| POST | `/login` | Se connecter → `{ token, profile }` |
| POST | `/logout` | Se déconnecter |
| GET | `/me` | Profil courant (sert aussi de heartbeat de présence) |
| PUT | `/profile` | Modifier nom, message perso, avatar, statut |
| GET | `/contacts` | Contacts acceptés |
| GET | `/pending` | Invitations reçues |
| POST | `/invite` | Inviter par adresse e-mail |
| POST | `/friendship/{id}/answer` | Accepter / refuser une invitation |
| GET | `/profile/{id}` | Profil public d’un contact |
| GET | `/messages/{id}?since=` | Conversation avec un contact (polling incrémental) |
| POST | `/messages` | Envoyer un message ou un wizz |

Toutes les routes sauf `register` et `login` attendent l’en-tête `Authorization: Bearer <token>`.
