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

## Casino slot machines

Six machines along the back wall with a gap between each, two of each kind. The server decides every spin.

| Machine | Game | Payback |
|---|---|---|
| Fruit Frenzy (green) | 3 reels, 1 line, three of a kind wins | about 89%, wins about 1 spin in 10 |
| Lucky Lines (red) | 3 x 3 grid, 5 lines (3 rows, 2 diagonals); every line of three pays | about 89%, wins about 1 spin in 5 |
| Prize Wheel (purple) | 16-slice wheel: blank, x1, x2, x3, x5 or the x100 jackpot | about 88%, odds shown on the machine (jackpot 1 in 667) |

## Dunk tank (Llama Acres)

Left of the barn. Stand on the grass in front of the target and press THROW (or tap the target). Stop the crosshair across, then up and down; a bullseye dunks whoever is on the seat. A throw costs 1 coin and a dunk pays 3 (up to 30 a day). Any llama can sit on the plank and earns 1 coin each time someone dunks them (up to 15 a day). When nobody is sitting, DUNKY takes the seat. Everyone in Llama Acres sees the ball fly and the splash.

## Hunger and thirst

Every llama has a 🍔 hunger and 💧 thirst meter (0 to 100) in the top bar. They only go down while you're online: thirst empties in about an hour, hunger in about 75 minutes. The server keeps the real numbers (the `needs` table is created automatically) and fills them when you buy something.

| Where | Item | Cost | Fills |
|---|---|---|---|
| Bar (sit on a stool, press ORDER) | Hay Soda / Grass Juice / Berry Shake | 1 / 1 / 2 | thirst 30 / 35 (+5 hunger) / 25 (+20 hunger) |
| Bar | Hay Nachos / Alfalfa Fries / Clover Burger | 2 / 2 / 3 | hunger 35 / 35 / 55 (salty snacks cost 5 thirst) |
| Llama Acres cider stand | Hot Cider / Caramel Cider | 2 / 3 | thirst 40 / 40 (+8 hunger) |
| Llama Acres snack stand | Caramel Apple / Corn / Apple Pie | 2 / 2 / 3 | hunger 30 / 35 / 45 |
| Llama Acres apples on the ground | apple | free | hunger 15 (once every 20 seconds) |

When either meter is empty, your llama walks slower and the arcade, arena, bowling and fishing pay half until it eats or drinks. Casino winnings are not affected.

## Spit Arena

A fourth room with a quick mini-game. Press PLAY (or tap the ring) for a 60-second spit-ball round.

- **Solo:** rival llamas wander the pit and spit back. Rivals flash `!` before they spit. Waves get faster every 15 seconds, the last 10 seconds are double points, and a golden llama worth 5 shows up three times a round. Power-ups: rapid fire, triple spit, shield.
- **Together:** everyone who presses PLAY during the countdown (or with 25+ seconds left) shares the round. Rivals, the golden llama and power-ups come from the round's seed, so everyone sees the same ones. A hit on another player only counts when that player's game confirms it.
- **Combos:** chain hits without getting hit for up to x5 points.
- **Rewards (decided by the server):** 1 token per 25 points (max 6 a round), +1 to +5 for the first round of the day (daily streak), +3 for winning a round with other players, +1 for second. Arena tokens are capped at 40 a day. Scores faster than the game allows are cut down.
- **Progress:** XP levels unlock spit colors (green 2, pink 4, gold 6, rainbow 8, fire 10). There's a weekly leaderboard (resets Monday, Eastern time) and an all-time best.
- The `arena` table is created automatically the first time someone plays.

## Llama Lanes (hay bale bowling)

A fifth room with four lanes. Press BOWL (or tap a lane or a lane screen) for a 5-frame game.

- **Bowling:** slide sideways to line up, then swipe up. Swipe speed is power, curving the end of the swipe adds hook. On a computer you can also drag with the mouse, or use the arrow keys to line up, A/D to aim, Q/E for hook and hold Space for power.
- **Scoring:** normal strike and spare scoring over 5 frames; the 5th frame gets bonus balls. A perfect game is 150.
- **Fair pinfall:** `tools/bowl_physics.js` is the one copy of the ball and pin physics. `python3 tools/sync_bowl.py` pastes it into both `src/worker.js` and `public/index.html`. The server simulates every roll and its result is the one that counts; the page runs the same code to animate it.
- **Coins:** 1 per 10 points (max 15), +2 for the first game of the day, +3 per turkey, +10 for a perfect game. Bowling coins are capped at 40 a day. Rolls must be at least 2.2 seconds apart.
- **Together:** the lane screens and the ALSO BOWLING panel show everyone's live score, and strikes are called out to the room.
- The `bowl` table is created automatically the first time someone bowls.

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

## Credits and licenses

Everything in the game is original to this project or openly licensed:

- **Art:** all rooms, llamas, furniture, signs, cards, slots and icons are pixel art drawn in code in `public/index.html`. No outside sprites or image packs.
- **Shirt pictures and logo:** product photos and the La Llama PIC logo from llamalifematters.com, owned by the store.
- **Music:** the three jukebox songs (Lounge Groove, Hayloft Hop, Funky Hooves) are original note patterns played by a tiny synthesizer in the browser. No recordings or samples.
- **Sound effects:** spit, splat, crunch and game sounds are synthesized in code. No recordings.
- **Fonts:** [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [Inter](https://fonts.google.com/specimen/Inter), both under the SIL Open Font License, loaded from Google Fonts.
- **Emoji** in menus are drawn by each player's own device.

If you add anything later (music, images, fonts), use your own work or something with a license that allows commercial use, and note it here.

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

## Accounts, email and password resets

- New players sign up with a llama name, an email and a password. They can log in with either the name or the email.
- Older accounts without an email get an "Add your email" pop-up after they enter a room (LATER hides it for a day). Anyone can add or change their email, or change their password, from Menu > ACCOUNT. Changing the email needs the current password.
- Forgot password sends a link that works once and expires in 30 minutes. Only a hash of each link is stored. Resetting logs the account out on every other device and sends a "your password was reset" notice.
- The forgot-password answer is the same whether or not an email has an account, so it can't be used to look up players. Forgot, reset, confirm and password checks are all rate limited.
- The server adds the new database columns (`users.email`, `users.email_ok`) and the `email_tokens` table on its own.

### Turning on the emails

Emails are sent with Cloudflare Email Service. Until it's set up, emails are still saved, but nothing is sent and FORGOT PASSWORD tells players to ask staff. To turn it on:

1. Have a domain on Cloudflare (for example the game's own domain) and onboard it under **Email > Email Sending** in the Cloudflare dashboard. Sending needs the Workers Paid plan.
2. In `wrangler.jsonc` add `"send_email": [{ "name": "EMAIL" }]` and `"vars": { "MAIL_FROM": "noreply@yourdomain.com", "APP_URL": "https://your-game-address" }`.

No API keys or passwords are involved.

## Friends

- Send a request by tapping another llama and pressing ⭐ ADD, or by typing a llama name in Menu > FRIENDS. If they already asked you, adding them just accepts.
- The other player gets a live notice, and a red dot appears on their menu button until they answer. They can ACCEPT or decline (✕). Declining and unfriending are silent.
- A wooden FRIENDS sign sits next to JOBS: the green number is friends online now, the pink badge is requests waiting. Tapping it opens the list.
- The friends list shows who's online and which room they're in, with GO ▶ to walk over to that room. Friends get a ⭐ on their name tag, and you get a ⭐ notice when a friend comes online.
- Limits: 100 friends plus sent requests per llama, 50 requests waiting for any one llama, and 10 requests a minute. Banned llamas drop off everyone's lists.
- Stored in the `friends` table (one row per pair), which the server creates on its own.

## Staff chat log, messages and pop-ups

- **Chat log:** Dashboard > CHAT LOG shows every public chat line, newest first, kept forever (stored in `chatlog`). Lines sent while muted are logged and tagged MUTED. Filter by name, or tap a line to MUTE, KICK, BAN or SHOW ONLY that player. Mods can mute, kick and ban players. Only the owner can unban or change mods, and nobody can act on the owner.
- **Private messages:** friends can message each other from the 💬 sign, the 💬 button in the friends list, or MESSAGE on a friend's llama. Messages are kept forever (stored in `dms`). Each llama can send 300 a day, and muted llamas can't send any.
- **Food and drink:** every drink and snack has 5 sips or bites, and each one fills a fifth of what it gives.
- **Pop-ups:** every pop-up has a header strip with a grab bar and ✕. Drag the strip to move the pop-up. It can't leave the screen, and it goes back to its usual spot when it closes.
- **Walking:** paths go around chairs, stools, benches and logs. A llama only steps onto a seat when it's going to sit there.
- Mods have a gold heart 💛 badge. The owner has the crown 👑.
- **Lounge wall:** the framed shirts and the round logo over the door are taken down, and the neon LLAMA LOUNGE sign hangs on that wall instead. Everything for the shirts (shop pop-ups, links, tips) is still in the code. Set `SHOW_MERCH = true` in `public/index.html` to hang them again, which also moves the sign back up into the sky.

## LLAMA STORE, wardrobe and inventory

- **The room:** framed La Llama P.I.C. shirts and logo on the left wall (they open the real shop pages), and a checkout counter whose catalog lists every real shirt. Penny the cashier llama is drawn with the same sprite code as player llamas, but players can't pick her. There's also a vending machine for drinks.
- **In-game clothes:** 21 items in 4 slots: 6 hats, 3 glasses, 4 neck pieces, and 8 shirts (the 5 real designs plus LOUNGE, ACRES and SPIT ARENA tees). Hats, shirts and neckwear hang on the two long racks, and the glasses sit in a glass case next to the register. Everything uses the same art as when it is worn. Prices are in tokens.
- **Buying:** buying only works in the store (tap a rack item, or press CLOTHES next to a rack). A new item goes on right away.
- **Inventory:** the 🎒 sign, the I key or MENU > INVENTORY. The CLOTHING tab lets you wear or take off anything you own, anywhere, with a preview of your llama (tap it to turn it). The STORAGE tab is a placeholder for now.
- **The server keeps the source of truth:** the item list and prices (`ITEMS` in `src/worker.js`), what each llama owns (`inv` table) and what it has on (`wear` table). It stamps the outfit onto every presence update, so nobody can wear something they haven't bought.
- **Your llama is permanent:** the llama picked at sign-up stays for good, and the server ignores attempts to change it.
- **Adding an item:** add it to `ITEMS` in both `src/worker.js` (slot and price) and `public/index.html` (name, colors and how it's drawn in `buildSprite`), then hang it on a rack in `RACK_A` / `RACK_B`.

## Fishing in the background and the "still there?" check

- Fishing keeps going in a background tab. A tiny worker keeps a steady tick, because browsers slow normal timers in hidden tabs. The server also allows up to a minute to reel in a bite.
- After 10 minutes with no input (clicks, keys, walking, chat), an "Are you still there?" pop-up appears with a 2-minute countdown, and the tab title flashes. I'M STILL HERE carries on (and recasts if you were fishing). No answer logs you out of the room, with a COME BACK button. Nothing is lost.
- The server enforces this too. A llama that hasn't moved, chatted or confirmed for 12 minutes can't cast or earn bar tips until it does, so a tampered game can't farm tokens unattended.
