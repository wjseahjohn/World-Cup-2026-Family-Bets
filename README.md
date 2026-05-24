# Family Bets ⚽

A family football betting tracker for Euro Cup / World Cup.
- Everyone places their own bets via a shared link
- Live odds fetched automatically from Singapore Pools
- Leaderboard updates in real-time after each match result

---

## Deploy to Vercel (takes ~5 minutes)

### 1. Push to GitHub
Create a new repo on GitHub and push this folder:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/family-bets.git
git push -u origin main
```

### 2. Import on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Click **Deploy** — defaults are fine

### 3. Add a KV database (stores all bets & matches)
1. In your Vercel project, go to **Storage** tab → **Create Database** → **KV**
2. Name it `family-bets-kv`, click Create
3. Click **Connect to Project** — Vercel auto-adds the env vars

### 4. Set your admin PIN
In Vercel project → **Settings** → **Environment Variables**:
- Key: `ADMIN_PIN`
- Value: whatever PIN you want (e.g. `5678`)

Click **Redeploy** after adding env vars.

---

## How to use

### Before the tournament (Admin)
1. Open the app → **Admin** tab → enter your PIN
2. Click **Add match** for each game — fill in teams, date, group
3. The app tries to fetch odds automatically from SG Pools
4. If odds are 0 (SG Pools layout changed), enter them manually in the odds fields

### During betting window (Family)
1. Share the Vercel URL with everyone
2. They enter their name, pick outcomes, enter stake, hit **Submit bets**
3. Odds are locked at the time they bet

### After each match (Admin)
1. Go to **Admin** → find the match → click the result (e.g. "Germany wins")
2. Leaderboard updates instantly for everyone

### During the tournament
- Leaderboard tab shows live profit/loss, hit rate, pending bets
- Green = in profit, red = in the hole

---

## Singapore Pools odds note

The scraper fetches odds from the SG Pools football odds page. If odds come back as 0,
it means SG Pools updated their HTML structure. In that case, enter odds manually via
the Admin panel — takes 30 seconds per match.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your PIN (KV_REST_API_URL not needed for local dev)
npm run dev
```
Open http://localhost:3000

Data is stored in memory during local dev (resets on restart). In production, Vercel KV persists everything.
