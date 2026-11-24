# Mizan

A personal routine, habit and dhikr tracker. Salah, dhikr, body, mind, work and character, with streaks.
Static files, no build step, no paid services.

- `index.html`, `app.css`, `app.js`: the app
- `data.js`: default areas, habits, habit ideas and the azkar library (with sources)
- `prayer.js`: prayer times calculated on the device (Karachi method and Hanafi Asr by default)
- `api/sync.js`: optional sync between phone and laptop (Vercel function + Upstash Redis free tier)
- `sw.js`, `manifest.webmanifest`, icons: offline support and home-screen install

## Deploy (free)

1. Push this folder to GitHub.
2. In Vercel: **Add New → Project**, import the repo, Framework **Other**, no build command.
3. Sync (optional): in the project, **Storage → Connect** the existing Upstash database (the Kharcha one works,
   keys are prefixed `mizan:`), then redeploy.
4. Open the production URL on your phone → Share → **Add to Home Screen**. Do the same on the laptop
   (Chrome: install icon in the address bar; Safari: File → Add to Dock).
5. In the app: **You → Turn on sync**, use the same passcode on both devices.

Always open the main production URL, not a per-deployment preview URL. Each URL keeps its own local data.

## Local preview

```
python3 -m http.server 5181
```
