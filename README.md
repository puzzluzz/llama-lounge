# Llama Lounge (your own server)

The game runs on your Cloudflare account, on the free plan:

- **Game page**: the files in `public/`
- **Server** (`src/worker.js`): accounts, logins, multiplayer, and every token payout
- **Database** `llama-lounge`: already created in your Cloudflare account, with its tables set up

## Put it online (about 10 minutes, one time)

1. **Install Node.js** (the "LTS" version) from https://nodejs.org if you don't have it.
2. **Unzip this folder.** Open a terminal in it:
   - Windows: open the folder, click the address bar, type `cmd` and press Enter.
   - Mac: right-click the folder and choose "New Terminal at Folder".
3. Run these one at a time:

   ```
   npm install
   npx wrangler login
   npx wrangler deploy
   ```

   - `wrangler login` opens your browser. Approve it with the **same Cloudflare account** that has the `llama-lounge` database.
   - `wrangler deploy` prints your game's address at the end. It looks like `https://llama-lounge.YOURNAME.workers.dev`.
4. **Open that address and sign up** with the name you want, like ERIC.
5. **Tell Claude your player name.** Claude will mark that account as the owner in the database, which turns on the moderation commands.

## Updating later

Each release bumps `VERSION` in `src/worker.js` and `GAME_VERSION` in `public/index.html` (they must match). If a player's open page is older than the server, the game tells them to refresh.

After any change, run `npx wrangler deploy` again from this folder. Accounts and tokens stay in the database.

## Owner and mods

The owner is the account with `role = 'admin'` in the `users` table (PUZZ). Nothing else can make someone the owner. The owner shows a gold crown by their name, mods show a blue shield. The server stamps these badges, so nobody can fake one.

Open **MENU > DASHBOARD** (only staff see it) to see who is online, who is muted or banned, the staff list and the staff log. You can also type commands in chat:

| Command | Owner | Mods |
|---|---|---|
| `/mute NAME`, `/unmute NAME` | yes | yes |
| `/kick NAME` (they can come back) | yes | yes |
| `/ban NAME`, `/unban NAME` (logs them out and blocks the account) | yes | no |
| `/mod NAME`, `/unmod NAME` | yes | no |

Rules the server enforces on every action: staff role is re-read from the database each time (a removed mod loses access instantly), nobody can act on the owner or on themselves, mods can't act on other mods, the owner row can never be changed by a command, staff actions are limited to 20 a minute, and every action is written to the staff log.

## Security

- **Passwords:** never stored. The server keeps only a salted PBKDF2-SHA256 hash (100,000 rounds).
- **Logins:** use a random session token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Page scripts can't read it, and other websites can't use it.
- **Brute-force limits:**
  - 8 wrong passwords per name per 15 minutes
  - 30 per internet connection per 15 minutes
  - 5 new accounts per connection per hour
- **Tokens:** only change on the server.
  - The server spins the slots, deals the table games and picks the fish.
  - Casino tables: roulette (single zero; colours, odd/even, halves pay 1 to 1, dozens 2 to 1, one number 35 to 1) and blackjack (pays 3 to 2, dealer stands on 17, double on two cards). The server spins, deals and pays; blackjack hands are kept in the room's storage between moves.
  - Slots are in the LLAMA CASINO: 13 machines in three kinds (FRUIT FRENZY, LLAMA CLASSIC, GOLDEN JACKPOT). Players bet 1, 2, 5 or 10 tokens; three of a kind pays the machine's paytable times the bet. Odds and paytables live in `SLOTS` in `src/worker.js`.
  - The server checks where you're standing before paying for carrots, fishing, the bar or drinks.
  - The cider and snack stands in LLAMA ACRES charge on the server too (cider 2 to 3 tokens, snacks 2 to 3 tokens).
  - Arcade scores faster than the game allows are rejected.
- **Audit log:** every token change is recorded in the `ledger` table.
- **Spoofing:** names and balances shown to other players come from the server, so nobody can fake them.

## Custom domain later

In the Cloudflare dashboard, open **Workers & Pages → llama-lounge → Settings → Domains & Routes → Add → Custom domain**.

## Files

| File | What it is |
|---|---|
| `public/index.html` | the game |
| `src/worker.js` | the server |
| `wrangler.jsonc` | Cloudflare settings, with your database ID already filled in |
| `schema.sql` | the database tables (already applied to your database) |
| `tools/build_client.py` | rebuilds `public/index.html` from Claude's game files. You don't need to run this. |
