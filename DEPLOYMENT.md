# Deployment preparation

Before deploying, review and rotate credentials exposed through Git history or other channels. The local `.env` files are no longer tracked, but earlier commits can still contain their contents. Platform account passwords are currently stored in plaintext; protect and encrypt them before using real credentials.

1. Create the backend environment from `backend/.env.example` on the server. Set `APP_ENV=production`, a strong `JWT_SECRET`, the production MongoDB URI, Apify token, actor ID, and `CORS_ORIGINS` to the exact comma-separated frontend origins (for example `https://example.com`). Restrict file permissions. Do not commit the file.
2. Create the frontend environment from `frontend/.env.example`. Set `VITE_API_URL` to the public backend origin, without `/api`. Vite embeds this value in the build; never put secrets in frontend environment variables.
3. Install dependencies with `npm ci` in each directory, run the backend tests (`node --test --experimental-test-isolation=none tests/*.test.js`), and build the frontend with `npm run build`.
4. Serve `frontend/dist` through Nginx with an SPA fallback to `index.html`, proxy `/api` to the backend, and enable HTTPS. Run `backend/server.js` using PM2, configure automatic startup, and restrict the backend port to the proxy where practical.
5. Check Atlas access, backups and restoration; verify authentication, account permissions, and the 11 PM Asia/Kolkata jobs on the server. Test the actor integrations and a real Reddit account before relying on automated verification. A stopped server does not automatically catch up a missed scheduled job.

Do not publish or deploy until plaintext credential storage, Git-history exposure, actor recovery after a crash, and live platform verification have been reviewed.
