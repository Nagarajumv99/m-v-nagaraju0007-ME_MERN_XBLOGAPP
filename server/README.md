# XBlogApp API

## Run locally

From this directory, install dependencies and create a local environment file:

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Set `MONGODB_URI` to a MongoDB database and replace `JWT_SECRET` with a long,
random secret. The API listens on port 5000 by default.

## Routes

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/google-login` | Public |
| GET | `/api/users/me` | Authenticated |
| PUT | `/api/users/me` | Authenticated |
| GET | `/api/users/me/posts` | Authenticated |
| GET | `/api/users/:user_id` | Public |
| GET | `/api/posts` | Public |
| POST | `/api/posts` | Authenticated |
| GET | `/api/posts/:post_id` | Public; optional Bearer token for like state |
| POST | `/api/posts/:post_id` | Post owner or admin |
| DELETE | `/api/posts/:post_id` | Post owner or admin |
| POST | `/api/posts/:post_id/like` | Authenticated |
| GET | `/api/posts/:post_id/comments` | Public |
| POST | `/api/posts/:post_id/comments` | Authenticated |
| DELETE | `/api/comments/:comment_id` | Comment author or admin |

Posts accept optional `search`, `tag`, and comma-separated `tags` query
parameters. Send JWTs as `Authorization: Bearer <token>`.

Google login requires a Google OAuth web client ID. Set `GOOGLE_CLIENT_ID` in
the server environment and the same value as `VITE_GOOGLE_CLIENT_ID` in the
client environment. Configure the OAuth client with the frontend origin
(`http://localhost:3000`) as an authorized JavaScript origin. The client uses
Google Identity Services to obtain an ID token; the API verifies its signature,
audience, expiry, and verified email with Google's public keys, then creates or
finds the user in MongoDB and issues the application's JWT. No Firebase project
or service account is required.
Image fields are stored as URLs; no image-upload endpoint is specified in the
API contract.
