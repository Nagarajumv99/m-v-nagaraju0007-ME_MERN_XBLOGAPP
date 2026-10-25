# Deployment

Deploy the API to Render and the React client to Vercel. MongoDB must be
reachable from Render; use MongoDB Atlas or another hosted MongoDB service, not
the local `127.0.0.1` URL.

## 1. Deploy the API to Render

1. Push this repository to a Git provider and create a new Render Blueprint
   from the repository. Render detects the root [`render.yaml`](./render.yaml)
   and creates the `xblogapp-api` web service.
2. Create a MongoDB Atlas database and database user. In Atlas Network Access,
   allow Render to connect (for initial testing, `0.0.0.0/0` allows connections
   from any IP; use stronger network restrictions if available). Copy the
   application's MongoDB connection string and replace its password placeholder.
3. In Render's service environment, set:
   - `MONGODB_URI` to the Atlas connection string.
   - `GOOGLE_CLIENT_ID` to the OAuth web client ID.
   - `CLIENT_ORIGINS` to the Vercel site origin, for example
     `https://your-project.vercel.app` (no trailing slash). Add additional
     comma-separated origins if needed.
4. Wait for the service health check at `/health` to pass and copy the Render
   service URL, such as `https://xblogapp-api.onrender.com`.

Render generates `JWT_SECRET`. Keep it private and do not reuse the Google
OAuth client secret as the JWT secret.

## 2. Deploy the client to Vercel

1. Import the same repository into Vercel and set **Root Directory** to
   `client`.
2. Use the detected Vite defaults: build command `npm run build` and output
   directory `dist`.
3. Add these project environment variables for Production (and Preview if
   needed):
   - `VITE_API_URL`: `https://your-render-service.onrender.com/api`
   - `VITE_GOOGLE_CLIENT_ID`: the same OAuth web client ID used by Render.
4. Deploy and copy the Vercel production origin, such as
   `https://your-project.vercel.app`. If it differs from the value configured
   for `CLIENT_ORIGINS`, update the Render variable and redeploy the API.

The Vercel [`vercel.json`](./client/vercel.json) rewrites client-side routes to
the React entry point.

## 3. Configure Google OAuth

In Google Cloud Console, configure the OAuth web client with the Vercel
production origin (no path or trailing slash) under **Authorized JavaScript
origins**, for example `https://your-project.vercel.app`. For the consent
screen's **Authorized domains**, use the base domain you control (preferably a
custom domain attached to Vercel); Google may not accept a platform-managed
`vercel.app` domain there. Keep `http://localhost:3000` as a JavaScript origin
only if local testing is still required.

Set the public home page and privacy policy on the OAuth consent screen to
public pages on a domain you control. Do not use localhost for those consent
screen URLs. Publish the OAuth app or add test users as required by the
consent-screen publishing status.

Only the OAuth client ID belongs in Vercel's `VITE_GOOGLE_CLIENT_ID`. Do not
expose the OAuth client secret in client variables or commit it to the
repository. If a client secret has been shared, rotate it in Google Cloud.
