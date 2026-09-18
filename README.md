# Pantry Diary — standalone app, no Claude account

This is a full rebuild of your app as a normal website that:
- talks straight to your existing Apps Script (`.../exec` URL) and your Google Sheet
- has no Claude account, no third-party login — the PIN you already built is the only lock
- can be installed on your phone's home screen like a real app
- keeps working (read-only from cache + queued saves) if your connection drops

You do not need to touch your Google Sheet or rebuild your backend. `Code.gs` stays exactly as it is. Everything below is about the **frontend** — the part that runs in the browser / on your phone.

---

## 0. What you're getting

```
pantry-native/
  index.html        the app screen (calendar, entries, stock, settings)
  style.css         styling
  config.js         your Apps Script URL (already filled in)
  api.js            talks to your Apps Script backend
  queue.js          offline queue + local cache
  app.js            all the app logic (calendar, PIN, forms, sync)
  manifest.webmanifest   makes it installable
  sw.js             lets it open instantly / partly offline
  icons/            app icon in a few sizes
```

Your `Code.gs` and old `Index.html` (the ones you uploaded) don't need to change. Your old in-Apps-Script UI will keep working too, side-by-side, if you ever open the `.../exec` link directly in a browser without params — that fallback is still in your `doGet`.

---

## 1. Confirm your Apps Script deployment is set up for outside access

This app calls your backend from a different website, so two settings matter. In the Apps Script editor:

1. Click **Deploy → Manage deployments**.
2. Edit your active deployment (pencil icon).
3. Confirm:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. If you change either setting, click **Deploy** again — this gives you a new version, but the same `/exec` URL keeps working.

This matters because the browser on your phone isn't logged into your Google account when it calls this URL — "Execute as: Me" means the script still runs with your permissions (so it can read/write your Sheet), and "Anyone" means Google won't block the request before it even reaches your code. Your PIN check inside `Code.gs` (`checkPinOrThrow`) is what actually protects your data — that part is untouched.

**Quick test:** open this in any browser:
```
https://script.google.com/macros/s/AKfycbze4x1yzWovLCRqQzfzI9a6U3wd40qT1qSNBzE82Z6SzCzQKq-4wcsc_HfrPHaCbYEvsw/exec?api=ping
```
You should see `{"success":true,"message":"ok"}`. If you get an HTML sign-in page instead, the deployment settings above need fixing.

---

## 2. Open the project in your IDE

1. Install [VS Code](https://code.visualstudio.com/) if you don't have it.
2. Download all the files above into one folder, e.g. `pantry-native/`.
3. Open that folder in VS Code (`File → Open Folder`).
4. `config.js` already has your Apps Script URL in it — nothing to edit there unless you redeploy and get a new URL later.

---

## 3. Run it locally to test

Browsers block some things (like service workers) when you just double-click an HTML file, so serve it properly:

**Option A — VS Code Live Server extension**
1. Install the "Live Server" extension in VS Code.
2. Right-click `index.html` → "Open with Live Server".
3. It opens in your browser at something like `http://127.0.0.1:5500`.

**Option B — Python (already on most machines)**
```bash
cd pantry-native
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

Enter your PIN (**1403**, from `Code.gs`) and confirm:
- the calendar loads and tapping a date lets you save an entry
- the Stock tab loads and totals look right
- Export Excel opens a download

If something fails, open your browser's DevTools (F12) → Console tab and read the error — most issues at this stage are the deployment-settings check in Step 1.

---

## 4. Put it on a real URL (so it can be installed on your phone)

A phone can only "install" a web app that's served over HTTPS from a real domain — not from your laptop's localhost. **GitHub Pages** is free and simplest:

1. Create a free GitHub account if you don't have one: https://github.com/join
2. Create a new repository (e.g. `pantry-diary`), public or private — both work with GitHub Pages on a personal account.
3. Upload all the files from `pantry-native/` into that repository (drag-and-drop works on github.com, or use `git push` if you're comfortable with git).
4. In the repository, go to **Settings → Pages**.
5. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder `/ (root)`. Save.
6. Wait about a minute, then GitHub shows you a URL like:
   ```
   https://yourusername.github.io/pantry-diary/
   ```
   That's your app's permanent address.

*(Netlify is an equally good alternative if you'd rather drag-and-drop a folder at https://app.netlify.com/drop with no git involved at all.)*

---

## 5. Install it on your phone

**Android (Chrome):**
1. Open your GitHub Pages URL on your phone.
2. You'll see an "Install" banner near the top of the app — tap it.
   *(If it doesn't appear: Chrome menu ⋮ → "Add to Home screen".)*
3. It now sits on your home screen with its own icon and opens full-screen, no browser bar.

**iPhone (Safari):**
1. Open your GitHub Pages URL in **Safari** specifically (this doesn't work from Chrome on iOS).
2. Tap the **Share** icon (square with an arrow) → **Add to Home Screen** → **Add**.
3. It now sits on your home screen like any other app.

From here on, daily use is: tap the icon → enter PIN once per session → use it exactly like before.

---

## 6. What happens if there's no signal

- Viewing the calendar/entries/stock: shows the last successfully loaded data for that month, clearly still usable, just not "live" until you're back online.
- Saving a daily entry or bulk stock while offline: it's applied to what you see immediately, and queued. A small banner shows "N item(s) waiting to sync." As soon as the phone gets signal again, it sends them automatically — or tap **Settings → Sync Now** any time.
- Exporting Excel needs a live connection (it's generated by your Sheet), so that one genuinely requires signal.

---

## 7. Keeping it in sync with your backend

`app.js` has its own copy of your recipe names (`RECIPES`) and ingredient list (`ALL_INGREDIENTS`) so the dropdowns match what `Code.gs` expects. **If you ever add/rename a recipe or ingredient in `Code.gs`, make the same edit at the top of `app.js`.** They're written to look identical on purpose, so it's a straightforward copy-paste.

---

## 8. Optional hardening (not required, worth knowing)

Right now, reads (`stock`, `entries`, `export`) send your PIN as part of the URL (`?pin=1403`), which is how your existing `Code.gs` is built. Over HTTPS this is reasonably safe for a household tool, but the PIN can end up in browser history or logs. If you want to close that gap later, it's a ~15 minute change: move those three GET endpoints to also go through `doPost` (like `saveDailyEntry` already does), so the PIN travels in the request body instead of the URL. Ask me when you're ready and I'll give you the exact `Code.gs` and `api.js` changes — no need to do it now.

---

That's the whole path: your Sheet stays the source of truth, your Apps Script stays the backend, and the only new thing is a proper installable front door on your phone.
