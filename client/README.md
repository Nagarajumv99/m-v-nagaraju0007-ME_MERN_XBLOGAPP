# XBlogApp frontend

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm start
```

The frontend runs at `http://localhost:3000` and calls
`http://localhost:5000/api` by default. Set `VITE_API_URL` to change the API
base URL. Start the backend separately before using account or post features.

The app includes signup and login, a public searchable/tag-filtered home feed,
a signed-in dashboard and profile editor, post create/edit/detail views,
comments and likes, and an admin dashboard for accounts whose backend role is
`admin`.

To enable Google sign-in, create a Google OAuth web client ID, set it as
`VITE_GOOGLE_CLIENT_ID` in `client/.env` and `GOOGLE_CLIENT_ID` in the server
environment, and add `http://localhost:3000` as an authorized JavaScript
origin. The frontend obtains a Google ID token with Google Identity Services;
the backend verifies it and stores the account in MongoDB. Firebase is not
required.
