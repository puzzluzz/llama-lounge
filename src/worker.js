// Llama Lounge server
// - /api/*  accounts: sign up, log in, log out, profile (D1 database "DB")
// - /ws     realtime room: presence, chat, and every token-changing action (Durable Object "LOUNGE")
// Static game files in ./public are served by Workers Assets.
import { DurableObject } from "cloudflare:workers";

// ---------- tunables ----------
const VERSION = "2026-11-28h";             // bump with every release; the page compares it with its own and asks to refresh
const START_TOKENS = 10;
const LLAMAS = ["twotone", "poophat", "tweed", "metal", "money", "gingham", "cancel"];   // llamas players can be
const BOOTH = { rm: "account", x: 7, y: 0, price: 20 };   // the changing booth in the ACCOUNT room: switch to another llama for 20 tokens
const SESSION_DAYS = 30;
const PBKDF2_ITERS = 100000;              // Workers' maximum for PBKDF2
const LOGIN_MAX_FAILS = 8;                // per username per 15 minutes
const IP_MAX_FAILS = 30;                  // per IP per 15 minutes
const SIGNUPS_PER_IP_HOUR = 5;
const WINDOW_MS = 15 * 60 * 1000;
// email: reset links last 30 minutes and work once; confirm links last 2 days. Limits are per 15 minutes.
const FRIENDS = { max: 100, inbox: 50 };
const DM = { len: 300, burst: 8, perDay: 300 };   // private messages: longest message, most per 10 seconds, most a day (kept forever)
// the staff chat log is kept forever too
const ROOM_IDS = new Set(["lounge", "barn", "casino", "arena", "lanes", "store", "account", "gym", "cove", "jungle"]);
const STAFF_GIVE_DAY = 500;   // most tokens a mod can give out in a day (the owner has no limit)
const AFK_MS = 12 * 60000;   // no moving, chatting or "I'm still here" for this long: no more fishing or bar tips until they're back
const SIPS = 3;
const PLINKO = { y: 3, rows: 8, bets: [1, 2, 5], mult: [9, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 9] };   // casino PLINKO: machine on the left wall at y 4-5; pays about 95% over time                                   // sips or bites in every drink and snack   // friends plus sent requests per llama; requests waiting for one llama
const RESET_MS = 30 * 60 * 1000, VERIFY_MS = 48 * 3600 * 1000;
const FORGOT_PER_IP = 6, FORGOT_PER_EMAIL = 3, RESET_BAD_PER_IP = 10, PW_CHECK_FAILS = 8;

// six slot machines on the casino's back wall with a gap between each, two of each kind; stools are one tile in front (y 1)
// symbols: cherry, lemon, carrot, bell, seven, llama.
//   FRUIT FRENZY: three reels, one line; three of a kind pays pay x the bet (wins about 1 spin in 10, pays back about 89%)
//   LUCKY LINES:  a 3 x 3 grid with 5 lines (3 rows, 2 diagonals); each line of three pays pay x the bet (about 1 in 5, 89%)
//   PRIZE WHEEL:  16 slices; the slice it stops on is the prize x the bet (pays back about 88%, 100x jackpot about 1 in 667)
const SLOT_X = [1, 3, 5, 7, 9, 11];
const SLOTS = {
  fruit:   { w: [40, 30, 15, 8, 5, 2],   pay: [6, 13, 30, 60, 150, 500] },
  classic: { w: [28, 24, 19, 14, 9, 6],  pay: [2, 3, 5, 8, 20, 100] },
};
const SLOT_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [6, 4, 2]];   // cells are row by row
const WHEEL = { slices: [0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 3, 0, 1, 0, 100], weight: { 0: 6856, 1: 7500, 2: 8000, 3: 4000, 5: 3000, 100: 150 } };
const slotKind = (x) => (x <= 3 ? "fruit" : x <= 7 ? "classic" : "gold");
const SLOT_BETS = [1, 2, 5, 10];
// casino tables (seats are where players sit; the server checks them)
const TABLE_BETS = [1, 2, 5, 10];
const ROUL_SEATS = [[5, 5], [5, 6], [8, 5], [8, 6], [6, 7], [7, 7]];
const BJ_SEATS = [[10, 5], [11, 5], [10, 9], [11, 9], [2, 6], [2, 7]];   // the third table is by the left wall
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
// roulette bets: what wins and what it pays back in total (stake included). Single zero: the house edge is 2.7%.
const ROUL = {
  red: { win: (n) => RED.has(n), back: 2 }, black: { win: (n) => n > 0 && !RED.has(n), back: 2 },
  odd: { win: (n) => n > 0 && n % 2 === 1, back: 2 }, even: { win: (n) => n > 0 && n % 2 === 0, back: 2 },
  low: { win: (n) => n >= 1 && n <= 18, back: 2 }, high: { win: (n) => n >= 19, back: 2 },
  d1: { win: (n) => n >= 1 && n <= 12, back: 3 }, d2: { win: (n) => n >= 13 && n <= 24, back: 3 }, d3: { win: (n) => n >= 25, back: 3 },
};
// blackjack: cards are 0-51 (rank = c % 13 with 0 = ace, suit = c / 13); two decks shuffled fresh each hand
const cardVal = (c) => { const r = c % 13; return r === 0 ? 11 : r >= 9 ? 10 : r + 1; };
function handTotal(cards) { let t = 0, aces = 0; for (const c of cards) { t += cardVal(c); if (c % 13 === 0) aces++; } while (t > 21 && aces) { t -= 10; aces--; } return t; }
const FISH = [{ n: "BLUEGILL", pay: 1, w: 70 }, { n: "BIG ORANGE CARP", pay: 2, w: 25 }, { n: "GOLDEN FISH", pay: 5, w: 5 }];
const CROP_KEYS = new Set(); for (const y of [13, 15, 17]) for (let x = 2; x <= 5; x++) CROP_KEYS.add(x + "," + y);
const POND = { x0: 15, x1: 20, y0: 3, y1: 7 };
const TABLES = [{ gx: 8, gy: 8 }, { gx: 3, gy: 8 }];
const CROP_MS = 90000, BAR_MS = 30000;
// market stands in LLAMA ACRES: where each one is and what it sells (token prices)
const STANDS = {
  cider: { rm: "barn", x: 7.5, y: 4, items: { ajuice: 1, cider: 2, caramel: 3 } },     // two tiles wide: x is the middle of the stall
  snack: { rm: "barn", x: 10.5, y: 4, items: { corn: 1, capple: 2, pie: 3 } },
  bar:   { rm: "lounge", items: { soda: 1, juice: 2, shake: 3, fries: 1, nachos: 2, burger: 3 } },   // sit at the bar to order
  vend:  { rm: "store", x: 5, y: 0.5, items: { soda: 1, juice: 2, shake: 3 } },
  svend: { rm: "store", x: 4, y: 0.5, items: { chips: 1, candy: 2, cookie: 3 } },   // snack machine next to it   // vending machine on the LLAMA STORE's back wall
};
// ---------- hunger and thirst ----------
// Meters go from 100 (full) to 0. They only drain while you're online: thirst empties in about an hour, hunger in 75 minutes.
// Everything you buy fills them right away. When either is empty, the mini-games pay half.
const NEEDS = { thirstMs: 60 * 60000, hungerMs: 75 * 60000, maxStep: 10 * 60000, saveMs: 60000, apple: 15, appleGap: 20000 };
// how much each fills scales with its price: 1 token = a third of the meter, 2 tokens = half, 3 tokens = all of it.
// Every place that sells food or drink (the lounge bar, the store machines, player-room machines, the Acres stands) has one of each tier.
const FOOD = { soda: { th: 33 }, juice: { th: 50, hu: 5 }, shake: { th: 100, hu: 15 }, ajuice: { th: 33 }, cider: { th: 50 }, caramel: { th: 100, hu: 8 },
  corn: { hu: 33 }, capple: { hu: 50 }, pie: { hu: 100 }, fries: { hu: 33, th: -3 }, nachos: { hu: 50, th: -5 }, burger: { hu: 100 },
  chips: { hu: 33, th: -3 }, candy: { hu: 50 }, cookie: { hu: 100 } };
// ---------- wardrobe: clothes you buy in the LLAMA STORE and wear anywhere ----------
// s = the slot it goes in (one item per slot), p = price in tokens. The game draws each one; this list is the source of truth.
const WEAR_SLOTS = ["hat", "eyes", "neck", "shirt", "hands", "legs"];
const ITEMS = {
  cap: { s: "hat", p: 20 }, cowboy: { s: "hat", p: 30 }, beanie: { s: "hat", p: 15 }, party: { s: "hat", p: 10 }, tophat: { s: "hat", p: 40 }, flowers: { s: "hat", p: 25 },
  shades: { s: "eyes", p: 20 }, hearts: { s: "eyes", p: 25 }, stars: { s: "eyes", p: 25 },
  bandana: { s: "neck", p: 12 }, bowtie: { s: "neck", p: 15 }, scarf: { s: "neck", p: 18 }, lei: { s: "neck", p: 15 },
  tee_smile: { s: "shirt", p: 25 }, tee_cancelled: { s: "shirt", p: 25 }, tee_wild: { s: "shirt", p: 25 }, tee_cancel: { s: "shirt", p: 25 }, tee_woke: { s: "shirt", p: 25 },
  tee_lounge: { s: "shirt", p: 25 }, tee_acres: { s: "shirt", p: 25 }, tee_arena: { s: "shirt", p: 25 },
  poncho: { s: "shirt", p: 35 }, poncho_orange: { s: "shirt", p: 35 },
  gloves: { s: "hands", p: 30 }, shorts: { s: "legs", p: 30 },
  crown: { s: "hat", p: 50 }, chullo: { s: "hat", p: 25 }, headphones: { s: "hat", p: 30 }, nerd: { s: "eyes", p: 15 }, glasses3d: { s: "eyes", p: 15 },
  chain: { s: "neck", p: 40 }, tie: { s: "neck", p: 15 }, hoodie_gray: { s: "shirt", p: 35 }, hoodie_pink: { s: "shirt", p: 35 }, sweater: { s: "shirt", p: 30 },
  tee_heart: { s: "shirt", p: 25 }, tee_llama: { s: "shirt", p: 25 },
};
// ---------- player rooms ----------
// One room per player. Only the owner can change it. Public rooms are open to everyone; private ones let in the owner,
// people on the owner's invite list, people the owner let in after they knocked (for a few hours), and staff.
const PR = { w: 11, h: 7, maxFurn: 40, maxRooms: 3,   // maxRooms: how many rooms one llama can own (3 for now)
    // player rooms: 11 wide, 7 deep (the long wall is the right one; the door is at the front of the left wall)
  clear: ["0,6", "1,6", "2,6", "3,6"], knockGap: 20000, letInMs: 3 * 3600e3, nameMax: 24 };
// wallpaper and flooring for player rooms: price in TOKENS (0 = free for everyone); you buy one once and can use it any time
const DECO_WALL = { lavender: 0, cream: 15, mint: 15, pink: 15, night: 15, wood: 25, stripes: 30, damask: 35, brick: 35, stars: 40, floral: 30 };
const DECO_FLOOR = { wood: 0, checker: 20, carpet: 20, marble: 25, grass: 20, parquet: 30, tiles: 30, cobble: 25, plaid: 25 };
// wallpaper and floors are items too: wp_<id> and fl_<id> sit in finv like furniture, so they can be kept and traded.
// Putting one up moves it from your bag onto your room; the one it replaces goes back into your bag. The free lavender and wood aren't items.
const DECO_ITEMS = Object.fromEntries([...Object.entries(DECO_WALL).filter(([, p]) => p > 0).map(([k, p]) => ["wp_" + k, p]), ...Object.entries(DECO_FLOOR).filter(([, p]) => p > 0).map(([k, p]) => ["fl_" + k, p])]);
// FLOOR SQUARES: floors are bought one square at a time and laid tile by tile, so a room can mix patterns (a path, a patio, a rug of marble).
// A square you own is the item ft_<kind> in finv. Laid squares are in ptile; the room's old whole floor (prooms.floor) shows wherever no square is laid.
// INDOOR ROOMS take floor squares; OUTDOOR plots and farms take grass squares. Neither kind can be laid in the other.
const TILES = { wood: 1, checker: 1, carpet: 1, marble: 2, grass: 1, parquet: 2, tiles: 2, cobble: 1, plaid: 1, deck: 1, slate: 2,   // floors (indoors)
  meadow: 1, lawn: 1, clover: 1, wild: 1, golden: 1 };                                                                                 // grass (outdoors)
const TILE_GRASS = new Set(["meadow", "lawn", "clover", "wild", "golden"]);
const TILE_NAMES = { wood: "OAK PLANKS", checker: "CHECKERBOARD", carpet: "BLUE CARPET", marble: "MARBLE", grass: "INDOOR LAWN", parquet: "PARQUET", tiles: "PAINTED TILES", cobble: "COBBLESTONE", plaid: "PLAID", deck: "DECK BOARDS", slate: "SLATE",
  meadow: "MEADOW GRASS", lawn: "MOWN LAWN", clover: "CLOVER", wild: "WILD GRASS", golden: "GOLDEN GRASS" };
const TILE_MAX_BUY = 200, TILE_MAX_PUT = 60;
const decoItem = (kind, id) => (kind === "w" ? "wp_" : "fl_") + id;
DECO_WALL.barn = 0; DECO_FLOOR.meadow = 0;   // free barn-plank wall and meadow floor (farms start with them)
const PR_WALLS = Object.keys(DECO_WALL), PR_FLOORS = Object.keys(DECO_FLOOR);
// FARMS: one per llama (on top of the regular rooms). Garden plots only go in a farm, up to FARM.maxPlots each.
// Crops: seed cost (TOKENS), grow time and what the harvest sells for. Short crops pay best per hour if you tend them; long ones suit time away.
// A visitor (not the owner) can water a growing plot once per planting: it finishes FARM.waterCut of its grow time sooner.
const FARM = { max: 1, maxPlots: 12, waterCut: 0.2, w: 12, h: 9, clear: ["0,8", "1,8", "2,8", "3,8"] };   // 12 plots plus paths and a few decorations fit; income is set by the plot cap, not the size   // farms are open fields, bigger than rooms, with a gate where the door would be
// ROOM KINDS: "room" (indoors, with walls), "plot" (an outdoor lot: an open field like a farm, no walls, no crops) and "farm".
const prOpen = (r) => !!r && (r.kind === "farm" || r.kind === "plot");
const prDim = (r) => (prOpen(r) ? FARM : PR);
const CROPS = { carrot: { n: "CARROTS", seed: 1, ms: 20 * 60e3, pay: 3 }, corn: { n: "CORN", seed: 2, ms: 45 * 60e3, pay: 5 },
  berry: { n: "STRAWBERRIES", seed: 3, ms: 2 * 3600e3, pay: 8 }, pumpkin: { n: "PUMPKINS", seed: 5, ms: 6 * 3600e3, pay: 13 } };
const FARM_ONLY = new Set(["plot"]);
// furniture you buy in the LLAMA STORE (kept in STORAGE until you place it); prices in tokens
const FURN_ITEMS = { plot: 20, scarecrow: 15, wheelbarrow: 14, trough: 12, beehive: 18, appletree: 25, sunflowers: 8, gfence: 6, cushion_pink: 5, cushion_teal: 5, cushion_gold: 5, stool: 6, hayseat: 6, log: 5, table: 12, lamp: 12, fern: 6, hay: 4, keg: 8, cabinet: 15, counter: 10, vending: 30, adminsign: 50, chair: 8, armchair: 15, bed: 25, bookshelf: 18, tv: 22, plant: 7, bigtv: 35, loveseat: 22, sofa: 30, snackvend: 30, rug_persian: 25, rug_round: 15, rug_stripe: 12, rug_shag: 18,
  palm: 18, brock: 8, tiki: 10, campfire: 15, jbush: 8, brazier: 15, parasol: 16, picnic: 14,   // OUTDOOR
  beanbag: 10, barstool: 7, dbed: 40, coffeetable: 14, roundtable: 16, floorlamp: 16, lavalamp: 12, cubeshelf: 14, dresser: 20, cactus: 5, flowers: 6, boombox: 18 , rug_mat_green: 6, rug_mat_red: 6, rug_mat_blue: 6, rug_mat_coir: 6, rug_mat_pink: 6, rug_mat_purple: 6 };
// what the store sells right now: one piece per category (the rest stay placeable for anyone who already owns them)
// vending machines players can put in their rooms, and what each one sells
const PV_ITEMS = { vending: { soda: 1, juice: 2, shake: 3 }, snackvend: { chips: 1, candy: 2, cookie: 3 } };
const FURN_SWITCH = new Set(["tv", "bigtv", "lamp", "floorlamp", "lavalamp", "boombox"]);   // things you can tap to switch on or off
const FURN_SIZE = { bed: 2, loveseat: 2, sofa: 3, bigtv: 2 };   // pieces bigger than one tile
const FURN_SIDEWAYS = new Set(["loveseat", "sofa"]);
// colour variants: same piece and price as their base, their own item so they're bought, stored and placed separately
const FURN_VARIANTS = { sofa_gray: "sofa", sofa_green: "sofa", sofa_red: "sofa", loveseat_mustard: "loveseat", loveseat_teal: "loveseat", loveseat_purple: "loveseat",
  armchair_mustard: "armchair", armchair_red: "armchair", armchair_gray: "armchair", bed_blue: "bed", bed_green: "bed", bed_purple: "bed", chair_walnut: "chair", chair_white: "chair", chair_red: "chair" };
// themed room kits: a set of pieces for 20% less than buying them one by one (the same list is in public/index.html)
const MARKET = { fee: 0.05, max: 10, maxPrice: 100000 };   // marketplace: 5% of each sale, 10 listings each, price cap
const KITS = { living: { n: "COZY LIVING ROOM", items: { sofa: 1, coffeetable: 1, armchair: 1, floorlamp: 1, rug_shag: 1, plant: 1, tv: 1 } },
  bedroom: { n: "DREAMY BEDROOM", items: { dbed: 1, dresser: 1, lavalamp: 1, rug_round: 1, bookshelf: 1, flowers: 1 } },
  diner: { n: "RETRO DINER", items: { roundtable: 1, chair_red: 4, barstool: 2, vending: 1 } },
  game: { n: "GAME ROOM", items: { bigtv: 1, beanbag: 2, boombox: 1, lavalamp: 1, snackvend: 1, rug_stripe: 1 } },
  study: { n: "STUDY NOOK", items: { bookshelf: 2, table: 1, chair_walnut: 1, lamp: 1, cubeshelf: 1, cactus: 1 } },
  starter: { n: "STARTER KIT", items: { chair: 1, table: 1, lamp: 1, plant: 1, rug_mat_green: 1 } },
  farm: { n: "FARM STARTER", items: { plot: 2, scarecrow: 1, sunflowers: 1, trough: 1, gfence: 2 } } };
const kitPrice = (k) => Math.round(Object.entries(KITS[k].items).reduce((t, [it, n]) => t + (FURN_ITEMS[it] || 0) * n, 0) * 0.8);
const furnBase = (item) => FURN_VARIANTS[item] || item;   // couches run along their back, so they turn the other way
const FURN_SALE = new Set(["palm", "brock", "tiki", "campfire", "jbush", "brazier", "parasol", "picnic", "plot", "scarecrow", "wheelbarrow", "trough", "beehive", "appletree", "sunflowers", "gfence", "chair", "armchair", "bed", "table", "lamp", "bookshelf", "tv", "plant", "adminsign", "bigtv", "loveseat", "sofa", "vending", "snackvend", "rug_persian", "rug_round", "rug_stripe", "rug_shag", "rug_mat_green", "rug_mat_red", "rug_mat_blue", "rug_mat_coir", "rug_mat_pink", "rug_mat_purple",
  "beanbag", "barstool", "dbed", "coffeetable", "roundtable", "floorlamp", "lavalamp", "cubeshelf", "dresser", "cactus", "flowers", "boombox"]);
for (const [k, b] of Object.entries(FURN_VARIANTS)) { FURN_ITEMS[k] = FURN_ITEMS[b]; FURN_SALE.add(k); }   // variants cost the same as their base
const FURN_STAFF = new Set(["adminsign"]);   // only mods and the owner can buy these
const FURN_WALL = new Set(["adminsign"]);
const FURN_RUG = new Set(["rug_persian", "rug_round", "rug_stripe", "rug_shag", "rug_mat_green", "rug_mat_red", "rug_mat_blue", "rug_mat_coir", "rug_mat_pink", "rug_mat_purple"]);   // lie flat on the floor: walk on them, put furniture on top
const FURN_DIM = { dbed: [2, 2], rug_persian: [3, 2], rug_round: [2, 2], rug_stripe: [3, 1], rug_shag: [2, 2], rug_mat_green: [2, 1], rug_mat_red: [2, 1], rug_mat_blue: [2, 1], rug_mat_coir: [2, 1], rug_mat_pink: [2, 1], rug_mat_purple: [2, 1] };   // width x depth (swapped when turned)
const layerOf = (item) => (FURN_WALL.has(item) ? "wall" : FURN_RUG.has(item) ? "rug" : "floor");    // hang on a wall: placed on a tile along a wall, don't take up floor space
const prId = (rm) => { const m = /^p:(\d{1,9})$/.exec(String(rm || "")); return m ? +m[1] : 0; };
const cleanRoomName = (n) => String(n || "").replace(/[^A-Za-z0-9 '!?&.,:-]/g, "").replace(/\s+/g, " ").trim().slice(0, PR.nameMax);

// ---------- BOXING GYM ----------
// Two fighters each pick a move every beat; the server settles the beat. JAB beats DODGE, DODGE beats HOOK, HOOK beats BLOCK, BLOCK beats JAB
// (a JAB also cuts a HOOK short). Cartoon hits only: no blood anywhere, a knockout just sits you down seeing stars.
const BOX = { beat: 1500, beats: 10, rounds: 3, rest: 3500, start: 3000, hp: 100, st: 100, dayCap: 40, pairPerDay: 3, minBeats: 8, inviteMs: 15000,
  pay: { rookie: 3, champ: 8, win: 10, lose: 2, draw: 4 } };
const BOX_MOVES = new Set(["jab", "hook", "block", "dodge"]);
const BOX_COST = { jab: 6, hook: 15, dodge: 8, block: -6, idle: -10 };
const BOX_BOTS = { rookie: { n: "ROOKIE RUSTY", smart: 0, idle: 0.25 }, champ: { n: "CHAMP DUKE", smart: 0.6, idle: 0.04 } };
const BOX_COUNTER = { jab: "block", hook: "dodge", block: "hook", dodge: "jab" };
// damage a move deals against the other fighter's move this beat
function boxHit(m, o) {
  if (m === "jab") return o === "block" ? 0 : o === "dodge" ? 7 : 6;
  if (m === "hook") return (o === "jab" || o === "dodge") ? 0 : o === "block" ? 8 : 12;
  if (m === "dodge") return o === "hook" ? 10 : 0;
  return 0;
}
// TREASURE COVE: an island (20 x 16, sea all round). The server buries the treasure; the detector only ever says how close the nearest one is.
const COVE = { w: 20, h: 16, n: 7, scanGap: 1100, digGap: 3200, holeMs: 120000, respawn: 12000, dayCap: 40, chestPerDay: 1,
  finds: [["coins", 3, 0.55], ["gold", 6, 0.28], ["gem", 10, 0.12], ["chest", 4, 0.05]],
  junk: ["an old boot", "a seashell", "a rubber duck", "a soggy map", "a crab (it waved and left)", "a bottle cap", "a starfish", "seaweed"] };
// solid things on the island (palms, rocks, the wreck, torches, the sign): you can't stand on or dig them. The page has the same list.
const COVE_SOLID = new Set(["5,2", "17,3", "17,10", "4,12", "10,13", "12,2", "13,2", "14,2", "12,3", "13,3", "14,3", "8,6", "14,11", "7,10", "1,6", "1,10", "2,5"]);
const coveSand = (x, y) => { if (!(x >= 0 && y >= 0 && x < COVE.w && y < COVE.h)) return false; const dx = Math.max(0, Math.abs(x + 0.5 - 10) - 5), dy = Math.max(0, Math.abs(y + 0.5 - 8) - 3); return dx * dx + dy * dy <= 17.64; };
// JUNGLE TEMPLE: same hunt, in a jungle clearing (20 x 16) ringed by thick undergrowth, with a temple, a waterfall pool and a stream
const JUNGLE_SOLID = new Set(["9,2", "6,13", "3,11", "15,12", "10,5", "7,9", "8,9", "13,7", "1,7", "12,3", "8,13", "2,5", "6,5"]);
for (let x = 2; x <= 6; x++) for (let y = 1; y <= 4; y++) JUNGLE_SOLID.add(x + "," + y);   // the temple
const jungleWater = (x, y) => (x >= 14 && y >= 1 && y <= 4) || (x >= 17 && y >= 5);
const jungleFloor = (x, y) => (x === 0 && y === 8) || (x >= 1 && x <= 18 && y >= 1 && y <= 14 && !jungleWater(x, y));
const jungleDiggable = (x, y) => jungleFloor(x, y) && x >= 1 && !JUNGLE_SOLID.has(x + "," + y) && !(x <= 2 && y >= 7 && y <= 9);
const coveDiggable = (x, y) => coveSand(x, y) && !COVE_SOLID.has(x + "," + y) && !(x <= 2 && y >= 7 && y <= 9);   // not the landing by the dock
const HUNTS = {
  cove:   { table: "cove", dig: (x, y) => coveDiggable(x, y), rare: "tchest", rareFind: "chest", finds: COVE.finds },
  jungle: { table: "jungle", dig: (x, y) => jungleDiggable(x, y), rare: "gidol", rareFind: "idol", finds: [["coins", 3, 0.55], ["gold", 6, 0.28], ["gem", 10, 0.12], ["idol", 4, 0.05]] },   // same odds as the cove, so neither room pays better
};
const halfIfEmpty = (a, n) => (a && a.nd && (a.nd.hu <= 0 || a.nd.th <= 0)) ? Math.floor(n / 2) : n;

// ---------- fair prizes (the code still calls them rares) ----------
// Keepsakes from the LLAMA ACRES HARVEST FAIR: a set number of each, then trading only. Each copy has its own number and owner so trades can tell copies apart.
// They go in STORAGE like other furniture (finv) and can be placed; the rares table tracks which numbered copies you own.
// open = when the drop starts (ms); each llama can buy up to RARE_EACH of each from the store (more only by trading).
const RARES = {
  statue: { n: "CRYSTAL LLAMA STATUE", p: 150, max: 50, open: 0 },
  throne: { n: "PRIZE HAY BALE", p: 250, max: 25, open: Date.parse("2026-11-21T01:00:00Z") },   // Friday 8:00 pm Eastern
};
const RARE_EACH = 2;
for (const [k, R] of Object.entries(RARES)) FURN_ITEMS[k] = R.p;
FURN_ITEMS.tchest = 25;   // PIRATE CHEST: only dug up at TREASURE COVE (never in the shop)
FURN_ITEMS.gidol = 25;    // GOLDEN IDOL: only dug up at the JUNGLE TEMPLE (never in the shop)   // rares are placeable furniture, but never in the normal shop (not in FURN_SALE)
// ---------- trading ----------
// Two llamas in the same room trade furniture, numbered rares and tokens. Both have to press READY on the exact same offers;
// any change un-readies both. The swap is one database transaction: if anything changed meanwhile, nothing moves.
const TRADE = { maxLines: 12, maxEach: 20, maxTk: 100000, ask: 60000 };

// ---------- daily rewards and quests ----------
// Log in each day and claim a reward; claiming on back-to-back days builds a streak (day 7 is the big one, then it loops).
// Each day every llama gets 3 quests picked from the pool; the server counts progress from what actually happens and pays
// right away, plus a bonus for finishing all 3. Days roll over at midnight US Eastern.
const DAILY = { rewards: [5, 6, 7, 8, 10, 12, 25], bonus: 10, per: 3 };
const QUESTS = {
  fish:    { n: 3, pay: 5, t: "Catch 3 fish at the pond in LLAMA ACRES" },
  harvest: { n: 3, pay: 5, t: "Harvest 3 carrots in LLAMA ACRES" },
  eat:     { n: 2, pay: 4, t: "Buy 2 drinks or snacks" },
  visit:   { n: 1, pay: 4, t: "Visit someone else's room" },
  like:    { n: 1, pay: 3, t: "Like a room you enjoy" },
  bowl:    { n: 1, pay: 6, t: "Finish a game at LLAMA LANES" },
  arena:   { n: 1, pay: 5, t: "Play a round in the SPIT ARENA" },
  dunk:    { n: 2, pay: 4, t: "Throw 2 balls at the dunk tank" },
  arcade:  { n: 1, pay: 4, t: "Play a game on the lounge arcade" },
  chat:    { n: 5, pay: 3, t: "Say 5 things in chat" },
  bar:     { n: 2, pay: 5, t: "Earn tips working the bar twice" },
};
function questsFor(uid, day) {   // the same 3 for a llama all day, different each day
  let h = 2166136261; for (const ch of uid + ":" + day) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const keys = Object.keys(QUESTS); for (let i = keys.length - 1; i > 0; i--) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; const j = h % (i + 1); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, DAILY.per);
}
// which successful actions count toward which quest
function questKeyFor(kind, res) {
  if (kind === "fish_reel") return "fish"; if (kind === "harvest") return "harvest"; if (kind === "buy" || kind === "drink") return "eat";
  if (kind === "pr_enter" && !res.mine) return "visit"; if (kind === "pr_like" && res.liked) return "like";
  if (kind === "bowl_roll" && res.done) return "bowl"; if (kind === "arena_end") return "arena"; if (kind === "dunk_throw") return "dunk";
  if (kind === "arcade") return "arcade"; if (kind === "bar_tick" && Number.isFinite(res.tk) && !res.started) return "bar";
  return null;
}

// ---------- database backups ----------
// Every 12 hours (cron in wrangler.jsonc) the whole game database is written out as SQL into a separate backup database
// (binding BACKUP), split into parts. The newest 4 are kept (2 days). Login sessions, reset links and login-attempt
// counters are skipped on purpose: they're temporary, and players simply log in again after a restore.
// Only the owner (users.role = 'admin') can list, make or download backups (they hold emails and password hashes).
const BACKUP = { keep: 4, skip: new Set(["sessions", "email_tokens", "login_attempts"]), part: 400000, page: 500 };
const sqlVal = (v) => (v === null || v === undefined) ? "NULL" : typeof v === "number" ? (Number.isFinite(v) ? String(v) : "NULL") : typeof v === "boolean" ? (v ? "1" : "0") : "'" + String(v).replace(/'/g, "''") + "'";
async function backupTables(env) {
  await env.BACKUP.prepare("CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, why TEXT NOT NULL, tables INTEGER NOT NULL, rows INTEGER NOT NULL, bytes INTEGER NOT NULL, parts INTEGER NOT NULL)").run();
  await env.BACKUP.prepare("CREATE TABLE IF NOT EXISTS backup_parts (bid INTEGER NOT NULL, part INTEGER NOT NULL, sql TEXT NOT NULL, PRIMARY KEY (bid, part))").run();
}
async function makeBackup(env, why) {
  if (!env.BACKUP) return null;
  await backupTables(env);
  const all = (await env.DB.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type DESC, name").all()).results || [];
  const tabs = all.filter((r) => r.type === "table" && !BACKUP.skip.has(r.name)), idx = all.filter((r) => r.type === "index" && !BACKUP.skip.has(r.tbl_name));
  const out = [`-- Llama Lounge database backup, ${new Date().toISOString()} (${why})`,
    "-- Restore into an EMPTY database. Not included on purpose: sessions, email_tokens, login_attempts (players just log in again).", ""];
  let rows = 0;
  for (const t of tabs) {
    out.push(t.sql + ";");
    for (let off = 0; ; off += BACKUP.page) {
      const rs = (await env.DB.prepare(`SELECT * FROM "${t.name.replace(/"/g, '""')}" ORDER BY rowid LIMIT ? OFFSET ?`).bind(BACKUP.page, off).all()).results || [];
      for (const r of rs) { const cols = Object.keys(r); out.push(`INSERT INTO ${t.name} (${cols.join(",")}) VALUES (${cols.map((c) => sqlVal(r[c])).join(",")});`); }
      rows += rs.length; if (rs.length < BACKUP.page) break;
    }
    out.push("");
  }
  for (const i of idx) out.push(i.sql + ";");
  const text = out.join("\n"), parts = [];
  for (let k = 0; k < text.length; k += BACKUP.part) parts.push(text.slice(k, k + BACKUP.part));
  const r = await env.BACKUP.prepare("INSERT INTO backups (t, why, tables, rows, bytes, parts) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(Date.now(), String(why).slice(0, 40), tabs.length, rows, text.length, parts.length).first();
  await env.BACKUP.batch(parts.map((p, k) => env.BACKUP.prepare("INSERT INTO backup_parts (bid, part, sql) VALUES (?, ?, ?)").bind(r.id, k, p)));
  // keep the newest few
  const old = (await env.BACKUP.prepare("SELECT id FROM backups ORDER BY id DESC LIMIT -1 OFFSET ?").bind(BACKUP.keep).all()).results || [];
  for (const o of old) { await env.BACKUP.prepare("DELETE FROM backup_parts WHERE bid = ?").bind(o.id).run(); await env.BACKUP.prepare("DELETE FROM backups WHERE id = ?").bind(o.id).run(); }
  return { id: r.id, rows, bytes: text.length, parts: parts.length };
}

// ---------- helpers ----------
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64u = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const json = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });
const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };   // tiny modulo bias is fine for a game
const pickW = (ws) => { let r = rnd(ws.reduce((a, b) => a + b, 0)); for (let i = 0; i < ws.length; i++) { if ((r -= ws[i]) < 0) return i; } return 0; };

async function sha256hex(s) { const d = await crypto.subtle.digest("SHA-256", enc.encode(s)); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function pbkdf2(password, saltBytes, iters) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: iters }, key, 256));
}
function sameBytes(a, b) { if (a.length !== b.length) return false; return crypto.subtle.timingSafeEqual(a, b); }

function cookieToken(req) { const m = /(?:^|;\s*)ll_s=([A-Za-z0-9_-]{20,})/.exec(req.headers.get("cookie") || ""); return m ? m[1] : null; }
const sessCookie = (tok, maxAge) => `ll_s=${tok}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const clientIp = (req) => req.headers.get("cf-connecting-ip") || "local";

async function sessionUser(env, req) {
  const tok = cookieToken(req); if (!tok) return null;
  const h = await sha256hex(tok);
  const row = await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.uid WHERE s.token_hash = ? AND s.expires > ?").bind(h, Date.now()).first();
  return row || null;
}
async function newSession(env, uid) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const tok = b64u(raw);
  await env.DB.prepare("INSERT INTO sessions (token_hash, uid, expires) VALUES (?, ?, ?)").bind(await sha256hex(tok), uid, Date.now() + SESSION_DAYS * 864e5).run();
  return tok;
}
// attempts limiter: returns true if this key is currently blocked
async function blocked(env, k, max) {
  const r = await env.DB.prepare("SELECT n, since FROM login_attempts WHERE k = ?").bind(k).first();
  return !!(r && Date.now() - r.since < WINDOW_MS && r.n >= max);
}
async function bump(env, k) {
  const now = Date.now();
  await env.DB.prepare("INSERT INTO login_attempts (k, n, since) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN ? - since > ? THEN 1 ELSE n + 1 END, since = CASE WHEN ? - since > ? THEN ? ELSE since END")
    .bind(k, now, now, WINDOW_MS, now, WINDOW_MS, now).run();
}
// staff: the owner is users.role = 'admin' (set in the database); mods are users.role = 'mod' and only the owner can make or remove them
// The owner is ONLY the account with users.role = 'admin' in the database. Never by name, setting or anything the browser sends.
const isAdmin = (env, u) => !!u && u.role === "admin";
// the role a llama HOLDS (set only in the database): used when someone else acts on them (staff can't be blocked, mods can't moderate mods, nobody moderates the owner)
const baseRole = (env, u) => (isAdmin(env, u) ? "owner" : u && u.role === "mod" ? "mod" : "");
// the role a llama can USE right now: STAFF POWERS NEED A PASSKEY on the account. Without one they play as a normal llama until they add it.
const staffRole = (env, u) => (u && u.pk_on ? baseRole(env, u) : "");
const profileOf = (env, u, timers = []) => ({ since: u.created || 0, email: u.email || "", emailOk: !!u.email_ok, mailOn: mailOn(env), name: u.name.toUpperCase(), c: u.c, agreed: u.agreed, bet: u.bet, tk: u.tk, bestHay: u.best_hay, bestDash: u.best_dash, admin: staffRole(env, u) === "owner", staff: staffRole(env, u), pkNeed: u.pk_on ? "" : baseRole(env, u), timers });

// ---------- email ----------
// Sending uses Cloudflare Email Service: a "send_email" binding named EMAIL plus a MAIL_FROM address on a domain
// set up in Cloudflare. Until both exist, accounts still save emails; reset and confirm emails just aren't sent.
const mailOn = (env) => !!(env.EMAIL && env.MAIL_FROM);
const normEmail = (e) => String(e || "").trim().toLowerCase();
const emailOk = (e) => e.length <= 254 && /^[^\s@<>()",;:]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e);
const siteUrl = (env, url) => (env.APP_URL || url.origin).replace(/\/+$/, "");
async function sendMail(env, to, subject, lines, link, button) {
  if (!mailOn(env)) return false;
  const text = lines.join("\n\n") + (link ? "\n\n" + link : "") + "\n\nLlama Lounge";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#2a2340"><h2 style="color:#d62d6a">🦙 Llama Lounge</h2>${lines.map((l) => `<p>${l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</p>`).join("")}${link ? `<p><a href="${link}" style="display:inline-block;background:#ffd23f;color:#2a1d00;padding:12px 22px;border-radius:12px;font-weight:bold;text-decoration:none">${button}</a></p><p style="font-size:12px;color:#777">Or paste this link into your browser:<br>${link}</p>` : ""}</div>`;
  try { await env.EMAIL.send({ to, from: { email: env.MAIL_FROM, name: "Llama Lounge" }, subject, text, html }); return true; }
  catch (e) { console.error("mail failed", e && e.code, e && e.message); return false; }
}
// one-time links: only a hash of the token is stored, so a database leak can't be used to reset anyone
async function newLink(env, uid, kind, email, ms) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const tok = b64u(raw);
  await env.DB.prepare("DELETE FROM email_tokens WHERE (uid = ? AND kind = ?) OR expires < ?").bind(uid, kind, Date.now()).run();
  await env.DB.prepare("INSERT INTO email_tokens (hash, uid, kind, email, expires) VALUES (?, ?, ?, ?, ?)").bind(await sha256hex(tok), uid, kind, email, Date.now() + ms).run();
  return tok;
}
async function takeLink(env, tok, kind) {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(String(tok || ""))) return null;
  const h = await sha256hex(tok);
  const row = await env.DB.prepare("SELECT * FROM email_tokens WHERE hash = ? AND kind = ? AND expires > ?").bind(h, kind, Date.now()).first();
  if (row) await env.DB.prepare("DELETE FROM email_tokens WHERE hash = ?").bind(h).run();   // every link works once
  return row;
}
async function sendVerify(env, url, u, email) {
  const tok = await newLink(env, u.id, "verify", email, VERIFY_MS);
  return sendMail(env, email, "Confirm your Llama Lounge email", [`Hi ${u.name.toUpperCase()}!`, "Tap the button to confirm this is your email. That way you can reset your password if you ever forget it.", "Didn't make a Llama Lounge account? You can ignore this email."], `${siteUrl(env, url)}/#verify=${tok}`, "CONFIRM MY EMAIL");
}
// names that could pass for staff or the game's own llamas can't be taken at sign-up (looks only: powers come from users.role, never a name)
function staffyName(name) {
  const l = String(name).toLowerCase().replace(/0/g, "o").replace(/[1!|]/g, "i").replace(/4|@/g, "a").replace(/3/g, "e").replace(/5|\$/g, "s").replace(/7/g, "t"), flat = l.replace(/[^a-z]/g, ""), parts = l.split(/[^a-z]+/).filter(Boolean);
  if (/(admin|owner|moderat|staff|official|support|llamalounge|system|helpdesk)/.test(flat)) return true;
  return parts.some((w) => ["mod", "mods", "gus", "penny", "dev", "devs"].includes(w)) || /^(mod|gus|penny)(s)?$/.test(flat) || /^mod[a-z]?$|mod$/.test(flat) && flat.length <= 6;
}
// extra check for ACCOUNT names only (they're permanent and on screen for everyone), on top of WF.nameOk: hate words, spelled-around swears
// and self-harm phrases anywhere in the name, after turning look-alike digits into letters. A few innocent words that contain a swear are let through.
const NAME_BAD = ["nazi", "hitler", "kkk", "fvck", "fuk", "phuck", "phuk", "fck", "biatch", "btch", "nigg", "nigr", "niqq", "killyourself", "killurself", "kyslol", "suicide",
  "cumlord", "cumslut", "pedophile", "pedobear", "molest", "incest", "hentai", "porn", "retard", "rapist", "whore", "slut", "cunt", "penis", "vagina", "dildo", "boob", "titty", "nude", "naked", "horny", "sexy", "milf", "jizz", "semen", "anus", "isisfighter", "jihad", "terrorist", "shooter", "school_shooter"];
const NAME_OK_WORDS = ["scunthorpe", "shitake", "shiitake", "cockatoo", "peacock", "hancock", "hitchcock", "therapist", "analyst", "grape", "cumin", "assassin", "classic", "bass", "pass", "sussex", "dickens", "skunk", "nazir", "nazira"];
function badName(name) {
  let l = String(name).toLowerCase().replace(/0/g, "o").replace(/[1!|]/g, "i").replace(/4|@/g, "a").replace(/3/g, "e").replace(/5|\$/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/9/g, "g");
  if (/^kys$|^kys_|_kys$/.test(l)) return true;
  let flat = l.replace(/[^a-z]/g, ""); for (const w of NAME_OK_WORDS) flat = flat.split(w).join("");
  return NAME_BAD.some((w) => flat.includes(w.replace(/_/g, "")));
}
function nameAllowed(name) {
  if (badName(name)) return false;
  let rest = String(name); for (const w of NAME_OK_WORDS) rest = rest.replace(new RegExp(w, "ig"), "");
  return rest.replace(/[^A-Za-z]/g, "") === "" ? true : WF.nameOk(rest);
}
// TIMED BANS: a ban with ban_until > 0 lifts itself once that time passes. Checked whenever the person tries to get in, and swept for everyone about once a minute.
let banSweepAt = 0;
async function sweepBans(env) { const now = Date.now(); if (now - banSweepAt < 60000) return; banSweepAt = now;
  try { await ensureAuthSchema(env); await env.DB.prepare("UPDATE users SET banned = 0, ban_until = 0 WHERE banned = 1 AND ban_until > 0 AND ban_until <= ?").bind(now).run(); } catch (e) { console.error("ban sweep", e); } }
// returns null if they may play (lifting an expired ban), or the message to show
async function banMsg(env, u) {
  if (!u || !u.banned) return null;
  const until = +u.ban_until || 0, now = Date.now();
  if (until > 0 && until <= now) { await env.DB.prepare("UPDATE users SET banned = 0, ban_until = 0 WHERE id = ?").bind(u.id).run(); u.banned = 0; u.ban_until = 0; return null; }
  if (!until) return "This account is banned.";
  const h = Math.ceil((until - now) / 36e5);
  return `This account is banned for ${h >= 48 ? Math.ceil(h / 24) + " more days" : h + (h === 1 ? " more hour" : " more hours")}.`;
}
// add the email columns and link table once per server start (safe to run on an existing database)
let authSchema = null;
function ensureAuthSchema(env) {
  if (!authSchema) authSchema = (async () => {
    for (const col of ["email TEXT", "email_ok INTEGER NOT NULL DEFAULT 0", "terms INTEGER NOT NULL DEFAULT 0", "ban_until INTEGER NOT NULL DEFAULT 0"]) {   // ban_until: when a timed ban ends (0 = permanent or not banned)   // terms: when they ticked "13 or older and I agree to the Terms"
      try { await env.DB.prepare("ALTER TABLE users ADD COLUMN " + col).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message || e))) throw e; }
    }
    await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email)").run();
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS email_tokens (hash TEXT PRIMARY KEY, uid INTEGER NOT NULL, kind TEXT NOT NULL, email TEXT NOT NULL, expires INTEGER NOT NULL)").run();
  })().catch((e) => { authSchema = null; throw e; });
  return authSchema;
}
let pkReady = null; async function ensurePk(env) { if (!pkReady) pkReady = pkSchema(env).catch((e) => { pkReady = null; throw e; }); return pkReady; }
async function setPassword(env, uid, pw) {
  const salt = new Uint8Array(16); crypto.getRandomValues(salt); const h = await pbkdf2(pw, salt, PBKDF2_ITERS);
  await env.DB.prepare("UPDATE users SET salt = ?, hash = ?, iters = ? WHERE id = ?").bind(b64(salt), b64(h), PBKDF2_ITERS, uid).run();
  await env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(uid).run();   // sign out everywhere
}
async function checkPassword(u, pw) { const h = await pbkdf2(pw, unb64(u.salt), u.iters); return sameBytes(h, unb64(u.hash)); }


// ---------- PASSKEYS (second login step for staff) ----------
// A passkey is a key pair kept by the person's device (Face ID, fingerprint or screen lock). The server stores only the PUBLIC key
// and checks a fresh signature at every login, so a stolen password alone can't get into an account that has one.
// Backup codes (8, one-time, only their hashes are stored) get you in if every device with the passkey is lost.
const PK = { chalMs: 5 * 60000, maxTries: 5, codes: 8 };
const unb64u = (s) => unb64(String(s || "").replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s || "").length + 3) % 4));
async function pkSchema(env) {
  for (const col of ["pk_on INTEGER NOT NULL DEFAULT 0", "pk_bk TEXT NOT NULL DEFAULT '[]'"]) { try { await env.DB.prepare("ALTER TABLE users ADD COLUMN " + col).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message || e))) throw e; } }
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS passkeys (id TEXT PRIMARY KEY, uid INTEGER NOT NULL, spki TEXT NOT NULL, alg INTEGER NOT NULL, counter INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS pk_chal (hash TEXT PRIMARY KEY, uid INTEGER NOT NULL, kind TEXT NOT NULL, chal TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0)").run();
}
const rpIdOf = (env, url) => new URL(siteUrl(env, url)).hostname;
async function pkChallenge(env, uid, kind) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const chal = b64u(raw);
  const tk = new Uint8Array(24); crypto.getRandomValues(tk); const ticket = b64u(tk);
  await env.DB.prepare("DELETE FROM pk_chal WHERE expires < ?").bind(Date.now()).run();
  await env.DB.prepare("INSERT INTO pk_chal (hash, uid, kind, chal, expires) VALUES (?, ?, ?, ?, ?)").bind(await sha256hex(ticket), uid, kind, chal, Date.now() + PK.chalMs).run();
  return { chal, ticket };
}
async function pkTicket(env, ticket, kind) { const row = await env.DB.prepare("SELECT * FROM pk_chal WHERE hash = ? AND kind = ?").bind(await sha256hex(String(ticket || "")), kind).first(); return row && row.expires > Date.now() ? row : null; }
// what the browser signed: the challenge, the action and the exact site
function pkClient(env, url, b64json, chal, type) { let c; try { c = JSON.parse(new TextDecoder().decode(unb64u(b64json))); } catch (e) { return false; }
  return c && c.type === type && c.challenge === chal && c.origin === new URL(siteUrl(env, url)).origin; }
// authenticator data: right site, the person was present and verified (Face ID, fingerprint or PIN)
async function pkAuthData(env, url, ad) { if (!ad || ad.length < 37) return null; const want = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(rpIdOf(env, url))));
  if (!sameBytes(ad.slice(0, 32), want)) return null; const flags = ad[32]; if (!(flags & 1) || !(flags & 4)) return null; return { counter: ((ad[33] << 24) | (ad[34] << 16) | (ad[35] << 8) | ad[36]) >>> 0 }; }
// ECDSA signatures come DER-encoded; WebCrypto wants the raw 64 bytes
function derToRaw(der) { let i = 2; if (der[1] & 0x80) i += der[1] & 0x7f; const read = () => { i++; let len = der[i++]; let v = der.slice(i, i + len); i += len; while (v.length > 32 && v[0] === 0) v = v.slice(1); const out = new Uint8Array(32); out.set(v, 32 - v.length); return out; };
  const r = read(), s2 = read(), raw = new Uint8Array(64); raw.set(r, 0); raw.set(s2, 32); return raw; }
async function pkVerifySig(spkiB64, alg, data, sig) {
  if (alg === -7) { const k = await crypto.subtle.importKey("spki", unb64(spkiB64), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]); return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, k, derToRaw(sig), data); }
  if (alg === -257) { const k = await crypto.subtle.importKey("spki", unb64(spkiB64), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]); return crypto.subtle.verify("RSASSA-PKCS1-v1_5", k, sig, data); }
  return false; }
async function pkBackupCodes(env, uid) { const codes = [], hashes = []; const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < PK.codes; i++) { const b = new Uint8Array(8); crypto.getRandomValues(b); const c = [...b].map((x) => A[x % A.length]).join(""); codes.push(c.slice(0, 4) + "-" + c.slice(4)); hashes.push(await sha256hex("bk:" + c)); }
  await env.DB.prepare("UPDATE users SET pk_bk = ? WHERE id = ?").bind(JSON.stringify(hashes), uid).run(); return codes; }
// the second step at login (or after a password reset): hand back a ticket and what the browser needs to ask for the passkey
async function pkLoginStep(env, url, u) { const { chal, ticket } = await pkChallenge(env, u.id, "login");
  const keys = ((await env.DB.prepare("SELECT id FROM passkeys WHERE uid = ?").bind(u.id).all()).results || []).map((r) => ({ type: "public-key", id: r.id }));
  return json({ need2fa: "passkey", t: ticket, opts: { challenge: chal, rpId: rpIdOf(env, url), allowCredentials: keys, userVerification: "required", timeout: 60000 } }); }

// same-origin check for anything that changes state
function originOk(req, url) { const o = req.headers.get("origin"); return !o || o === url.origin; }

// ---------- HTTP entry ----------
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      if (!originOk(req, url) || !req.headers.get("origin")) return new Response("bad origin", { status: 403 });
      if (req.headers.get("upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      await ensureAuthSchema(env); await sweepBans(env);
      const u = await sessionUser(env, req);
      if (!u) return new Response("not logged in", { status: 401 });
      if (await banMsg(env, u)) return new Response("banned", { status: 403 });
      // hand the verified identity to the room; the Durable Object is not reachable from the internet directly
      const fwd = new Request("https://room/ws", { headers: { upgrade: "websocket", "x-uid": String(u.id), "x-name": u.name.toUpperCase(), "x-staff": staffRole(env, u) } });
      return env.LOUNGE.get(env.LOUNGE.idFromName("main")).fetch(fwd);
    }
    if (url.pathname.startsWith("/api/")) {
      try { await ensureAuthSchema(env); await ensurePk(env); await sweepBans(env); return await api(req, env, url, ctx); } catch (e) { console.error(e); return json({ error: "server error" }, 500); }
    }
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
  // twice a day: back up the database (see BACKUP above)
  async scheduled(event, env, ctx) { banSweepAt = 0; ctx.waitUntil(sweepBans(env)); ctx.waitUntil(makeBackup(env, "automatic").then((b) => console.log("backup done", JSON.stringify(b))).catch((e) => console.error("backup failed", e && e.message))); },
};

async function api(req, env, url, ctx) {
  const later = (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p);
  const path = url.pathname;
  if (req.method === "GET" && path === "/api/me") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    { const bm = await banMsg(env, u); if (bm) return json({ error: bm }, 403); }
    const t = await env.DB.prepare("SELECT k, t FROM timers WHERE uid = ? AND k LIKE 'crop:%'").bind(u.id).all();
    return json(profileOf(env, u, (t.results || []).map((r) => ({ k: r.k.slice(5), left: Math.max(0, r.t - Date.now()) }))));
  }
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  if (!originOk(req, url)) return json({ error: "bad origin" }, 403);
  if (!(req.headers.get("content-type") || "").includes("application/json")) return json({ error: "bad request" }, 400);
  const body = await req.json().catch(() => ({}));
  const ip = clientIp(req);

  if (path === "/api/signup") {
    const name = String(body.u || "").trim(), pw = String(body.p || ""), email = normEmail(body.e);
    if (!/^[A-Za-z0-9_]{3,12}$/.test(name)) return json({ error: "Names are 3 to 12 letters, numbers or _." }, 400);
    if (!nameAllowed(name)) return json({ error: "That name isn't allowed. Pick a different one." }, 400);
    if (staffyName(name)) return json({ error: "That name sounds like staff. Pick a different one." }, 400);
    if (body.t !== 1 && body.t !== true) return json({ error: "Please confirm you're 13 or older and agree to the Terms." }, 400);
    if (!emailOk(email)) return json({ error: "Enter a real email. It's how you reset your password." }, 400);
    if (pw.length < 8 || pw.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    if (await blocked(env, "su:" + ip, SIGNUPS_PER_IP_HOUR)) return json({ error: "Too many new accounts from here. Try again later." }, 429);
    const salt = new Uint8Array(16); crypto.getRandomValues(salt);
    const hash = await pbkdf2(pw, salt, PBKDF2_ITERS);
    try {
      const r = await env.DB.prepare("INSERT INTO users (name, salt, hash, iters, created, tk, email, terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(name, b64(salt), b64(hash), PBKDF2_ITERS, Date.now(), START_TOKENS, email, Date.now()).run();
      await bump(env, "su:" + ip);
      const tok = await newSession(env, r.meta.last_row_id);
      const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(r.meta.last_row_id).first();
      later(sendVerify(env, url, u, email));
      return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
    } catch (e) {
      if (String(e).includes("UNIQUE")) return json({ error: String(e).includes("email") ? "That email already has an account. Log in, or use FORGOT PASSWORD." : "That name is taken." }, 409);
      throw e;
    }
  }
  if (path === "/api/login") {
    const name = String(body.u || "").trim(), pw = String(body.p || "");   // a llama name or an email
    const uk = "u:" + name.toLowerCase(), ik = "ip:" + ip;
    if (await blocked(env, uk, LOGIN_MAX_FAILS) || await blocked(env, ik, IP_MAX_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const u = name.includes("@") ? (emailOk(normEmail(name)) ? await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(normEmail(name)).first() : null)
      : /^[A-Za-z0-9_]{3,12}$/.test(name) ? await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(name).first() : null;
    // always run the hash so a wrong name and a wrong password take the same time
    const salt = u ? unb64(u.salt) : new Uint8Array(16);
    const h = await pbkdf2(pw, salt, u ? u.iters : PBKDF2_ITERS);
    if (!u || !sameBytes(h, unb64(u.hash))) { await bump(env, uk); await bump(env, ik); return json({ error: "Wrong name, email or password." }, 401); }
    { const bm = await banMsg(env, u); if (bm) return json({ error: bm }, 403); }
    await env.DB.prepare("DELETE FROM login_attempts WHERE k = ?").bind(uk).run();
    await env.DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(Date.now()).run();
    if (u.pk_on) return pkLoginStep(env, url, u);   // password was right; now the passkey
    const tok = await newSession(env, u.id);
    return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }

  // second login step: a passkey signature, or one backup code
  if (path === "/api/login2") {
    if (await blocked(env, "l2:" + ip, IP_MAX_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const row = await pkTicket(env, body.t, "login"); if (!row) return json({ error: "That took too long. Log in again." }, 400);
    if (row.tries >= PK.maxTries) return json({ error: "Too many tries. Log in again." }, 429);
    await env.DB.prepare("UPDATE pk_chal SET tries = tries + 1 WHERE hash = ?").bind(row.hash).run();
    const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.uid).first(); if (!u || !u.pk_on) return json({ error: "Log in again." }, 400);
    { const bm = await banMsg(env, u); if (bm) return json({ error: bm }, 403); }
    let ok = false;
    if (body.code) { const c = String(body.code).toUpperCase().replace(/[^A-Z0-9]/g, ""), h = await sha256hex("bk:" + c); const list = JSON.parse(u.pk_bk || "[]"); const i = list.indexOf(h);
      if (c.length === 8 && i >= 0) { list.splice(i, 1); await env.DB.prepare("UPDATE users SET pk_bk = ? WHERE id = ?").bind(JSON.stringify(list), u.id).run(); ok = true;
        if (u.email) later(sendMail(env, u.email, "A Llama Lounge backup code was used", [`Hi ${u.name.toUpperCase()}, one of your backup codes was just used to log in. ${list.length} left.`, "If this wasn't you, tell the owner right away."])); } }
    else if (body.cred && typeof body.cred === "object") { const C = body.cred, key = await env.DB.prepare("SELECT * FROM passkeys WHERE id = ? AND uid = ?").bind(String(C.id || ""), u.id).first();
      if (key && pkClient(env, url, C.clientDataJSON, row.chal, "webauthn.get")) { const ad = unb64u(C.authenticatorData), info = await pkAuthData(env, url, ad);
        if (info && !(key.counter > 0 && info.counter <= key.counter)) { const cd = new Uint8Array(await crypto.subtle.digest("SHA-256", unb64u(C.clientDataJSON))), data = new Uint8Array(ad.length + 32); data.set(ad, 0); data.set(cd, ad.length);
          try { ok = await pkVerifySig(key.spki, key.alg, data, unb64u(C.signature)); } catch (e) { ok = false; }
          if (ok) await env.DB.prepare("UPDATE passkeys SET counter = ? WHERE id = ?").bind(info.counter, key.id).run(); } } }
    if (!ok) { await bump(env, "l2:" + ip); return json({ error: body.code ? "That backup code didn't work." : "That passkey didn't work. Try again, or use a backup code." }, 401); }
    await env.DB.prepare("DELETE FROM pk_chal WHERE hash = ?").bind(row.hash).run();
    const tok = await newSession(env, u.id);
    return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  // add a passkey (needs your password again), then finish with what your device signed
  if (path === "/api/pk/start") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, String(body.p || "")))) { await bump(env, "pw:" + u.id); return json({ error: "That isn't your login password. Type the one you log in with." }, 401); }
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM passkeys WHERE uid = ?").bind(u.id).first(); if (n && n.n >= 5) return json({ error: "You already have 5 passkeys. Remove them and start again." }, 400);
    const { chal, ticket } = await pkChallenge(env, u.id, "reg"), uidBytes = enc.encode("ll:" + u.id);
    const have = ((await env.DB.prepare("SELECT id FROM passkeys WHERE uid = ?").bind(u.id).all()).results || []).map((r) => ({ type: "public-key", id: r.id }));
    return json({ ok: true, t: ticket, opts: { challenge: chal, rp: { name: "Llama Lounge", id: rpIdOf(env, url) }, user: { id: b64u(uidBytes), name: u.name.toUpperCase(), displayName: u.name.toUpperCase() },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { residentKey: "preferred", userVerification: "required" }, excludeCredentials: have, attestation: "none", timeout: 60000 } });
  }
  if (path === "/api/pk/finish") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const row = await pkTicket(env, body.t, "reg"); if (!row || row.uid !== u.id) return json({ error: "That took too long. Try again." }, 400);
    await env.DB.prepare("DELETE FROM pk_chal WHERE hash = ?").bind(row.hash).run();
    const C = body.cred || {}, alg = Math.floor(+C.alg), id = String(C.id || "");
    if (!/^[A-Za-z0-9_-]{16,1400}$/.test(id) || ![-7, -257].includes(alg) || !C.spki) return json({ error: "Your device made a passkey we can't use. Try another device." }, 400);
    if (!pkClient(env, url, C.clientDataJSON, row.chal, "webauthn.create")) return json({ error: "That passkey wasn't for this site." }, 400);
    if (!(await pkAuthData(env, url, unb64u(C.authenticatorData)))) return json({ error: "Your device didn't confirm it's you (Face ID, fingerprint or PIN)." }, 400);
    try { await crypto.subtle.importKey("spki", unb64u(C.spki), alg === -7 ? { name: "ECDSA", namedCurve: "P-256" } : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]); } catch (e) { return json({ error: "Your device made a passkey we can't use. Try another device." }, 400); }
    await env.DB.prepare("INSERT INTO passkeys (id, uid, spki, alg, counter, created) VALUES (?, ?, ?, ?, 0, ?)").bind(id, u.id, b64(unb64u(C.spki)), alg, Date.now()).run();
    const first = !u.pk_on; await env.DB.prepare("UPDATE users SET pk_on = 1 WHERE id = ?").bind(u.id).run();
    const codes = first ? await pkBackupCodes(env, u.id) : null;
    await env.DB.prepare("DELETE FROM sessions WHERE uid = ? AND token_hash != ?").bind(u.id, await sha256hex(cookieToken(req) || "")).run();   // other devices have to log in with it now
    if (u.email) later(sendMail(env, u.email, "A passkey was added to your Llama Lounge account", [`Hi ${u.name.toUpperCase()}, a passkey was just added. From now on you'll confirm logins with it.`, "If this wasn't you, tell the owner right away."]));
    return json({ ok: true, codes });
  }
  if (path === "/api/pk/status") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM passkeys WHERE uid = ?").bind(u.id).first();
    return json({ ok: true, on: !!u.pk_on, keys: n ? n.n : 0, codes: JSON.parse(u.pk_bk || "[]").length });
  }
  if (path === "/api/pk/codes") {   // new backup codes (the old ones stop working); needs your password
    const u = await sessionUser(env, req); if (!u || !u.pk_on) return json({ error: "not logged in" }, 401);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, String(body.p || "")))) { await bump(env, "pw:" + u.id); return json({ error: "Password is wrong." }, 401); }
    return json({ ok: true, codes: await pkBackupCodes(env, u.id) });
  }
  if (path === "/api/pk/off") {   // remove every passkey; needs your password
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, String(body.p || "")))) { await bump(env, "pw:" + u.id); return json({ error: "Password is wrong." }, 401); }
    await env.DB.prepare("DELETE FROM passkeys WHERE uid = ?").bind(u.id).run(); await env.DB.prepare("UPDATE users SET pk_on = 0, pk_bk = '[]' WHERE id = ?").bind(u.id).run();
    if (u.email) later(sendMail(env, u.email, "Passkeys removed from your Llama Lounge account", [`Hi ${u.name.toUpperCase()}, all passkeys were just removed. Logins only need your password now.`, "If this wasn't you, tell the owner right away."]));
    return json({ ok: true });
  }
  // the game in someone's browser reporting its own crash (grouped: the same error from many players is one row with a count)
  if (path === "/api/clienterr") {
    if (await blocked(env, "ce:" + ip, 40)) return json({ ok: true });
    await bump(env, "ce:" + ip);
    const cut = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").slice(0, n);
    const msg = cut(body.m, 300), src = cut(body.s, 200), line = Math.max(0, Math.floor(+body.l || 0)), stack = cut(body.st, 1200), ua = cut(body.ua, 160), room = cut(body.r, 24);
    if (!msg) return json({ ok: true });
    const u = await sessionUser(env, req), who = u ? u.name.toUpperCase() : "";
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS clienterr (k TEXT PRIMARY KEY, msg TEXT NOT NULL, src TEXT, line INTEGER, stack TEXT, ua TEXT, room TEXT, first INTEGER NOT NULL, last INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 1, users TEXT NOT NULL DEFAULT '[]')").run();
    const k = await sha256hex(msg + "|" + src + "|" + line), now = Date.now();
    const row = await env.DB.prepare("SELECT users FROM clienterr WHERE k = ?").bind(k).first();
    if (!row) await env.DB.prepare("INSERT INTO clienterr (k, msg, src, line, stack, ua, room, first, last, n, users) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)").bind(k, msg, src, line, stack, ua, room, now, now, JSON.stringify(who ? [who] : [])).run();
    else { let us = []; try { us = JSON.parse(row.users || "[]"); } catch (e) {} if (who && !us.includes(who) && us.length < 30) us.push(who);
      await env.DB.prepare("UPDATE clienterr SET n = n + 1, last = ?, ua = ?, room = ?, stack = ?, users = ? WHERE k = ?").bind(now, ua, room, stack || "", JSON.stringify(us), k).run(); }
    return json({ ok: true });
  }
  if (path === "/api/logout") {
    const tok = cookieToken(req); if (tok) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256hex(tok)).run();
    return json({ ok: true }, 200, { "set-cookie": sessCookie("x".repeat(24), 0) });
  }
  if (path === "/api/password") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const oldp = String(body.old || ""), np = String(body.p || "");
    if (np.length < 8 || np.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, oldp))) { await bump(env, "pw:" + u.id); return json({ error: "Current password is wrong." }, 401); }
    await setPassword(env, u.id, np);
    if (u.email) later(sendMail(env, u.email, "Your Llama Lounge password was changed", [`Hi ${u.name.toUpperCase()}, your password was just changed and every other device was logged out.`, "If this wasn't you, use FORGOT PASSWORD on the login screen right away."]));
    const tok = await newSession(env, u.id);
    return json({ ok: true }, 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  // add or change the account email (needs the current password, so a stolen session can't redirect resets)
  if (path === "/api/email") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const email = normEmail(body.e), pw = String(body.p || "");
    if (!emailOk(email)) return json({ error: "That doesn't look like an email." }, 400);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, pw))) { await bump(env, "pw:" + u.id); return json({ error: "Password is wrong." }, 401); }
    if (email === u.email) return json({ error: "That's already your email." }, 400);
    try { await env.DB.prepare("UPDATE users SET email = ?, email_ok = 0 WHERE id = ?").bind(email, u.id).run(); }
    catch (e) { if (String(e).includes("UNIQUE")) return json({ error: "That email is on another account." }, 409); throw e; }
    await env.DB.prepare("DELETE FROM email_tokens WHERE uid = ? AND kind = 'reset'").bind(u.id).run();   // old reset links stop working
    later(sendVerify(env, url, u, email));
    if (u.email) later(sendMail(env, u.email, "Your Llama Lounge email was changed", [`Hi ${u.name.toUpperCase()}, the email on your account was changed to ${email}.`, "If this wasn't you, reply to a staff member in the game right away."]));
    const nu = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(u.id).first();
    return json({ ok: true, ...profileOf(env, nu) });
  }
  if (path === "/api/verify/resend") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    if (!u.email || u.email_ok) return json({ ok: true });
    if (await blocked(env, "vr:" + u.id, 3)) return json({ error: "We just sent one. Check your inbox and spam folder." }, 429);
    await bump(env, "vr:" + u.id);
    return json({ ok: true, sent: await sendVerify(env, url, u, u.email) });
  }
  if (path === "/api/verify") {
    if (await blocked(env, "rs:" + ip, RESET_BAD_PER_IP)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const row = await takeLink(env, body.t, "verify");
    if (!row) { await bump(env, "rs:" + ip); return json({ error: "This confirm link expired or was already used." }, 400); }
    const r = await env.DB.prepare("UPDATE users SET email_ok = 1 WHERE id = ? AND email = ?").bind(row.uid, row.email).run();
    if (!r.meta.changes) return json({ error: "This link is for an email that's no longer on the account." }, 400);
    return json({ ok: true });
  }
  // forgot password: the answer is always the same, so nobody can use it to find out which emails have accounts
  if (path === "/api/forgot") {
    const email = normEmail(body.e);
    if (!emailOk(email)) return json({ error: "Enter the email on your account." }, 400);
    if (await blocked(env, "fg:" + ip, FORGOT_PER_IP) || await blocked(env, "fe:" + email, FORGOT_PER_EMAIL)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    await bump(env, "fg:" + ip); await bump(env, "fe:" + email);
    const u = await env.DB.prepare("SELECT * FROM users WHERE email = ? AND banned = 0").bind(email).first();
    if (u) {
      const tok = await newLink(env, u.id, "reset", email, RESET_MS), link = `${siteUrl(env, url)}/#reset=${tok}`;
      if (!mailOn(env) && ["localhost", "127.0.0.1"].includes(url.hostname)) console.log("[dev] reset link for " + u.name + ": " + link);
      later(sendMail(env, email, "Reset your Llama Lounge password", [`Hi ${u.name.toUpperCase()}!`, "Someone asked to reset your password. Tap the button to pick a new one. The link works once and expires in 30 minutes.", "Didn't ask for this? Ignore this email and your password stays the same."], link, "RESET MY PASSWORD"));
    }
    return json({ ok: true, mailOn: mailOn(env) });
  }
  if (path === "/api/reset") {
    if (await blocked(env, "rs:" + ip, RESET_BAD_PER_IP)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const np = String(body.p || "");
    if (np.length < 8 || np.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    const row = await takeLink(env, body.t, "reset");
    if (!row) { await bump(env, "rs:" + ip); return json({ error: "This reset link expired or was already used. Ask for a new one." }, 400); }
    const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.uid).first();
    if (!u || u.email !== row.email) return json({ error: "This reset link is no longer valid. Ask for a new one." }, 400);
    { const bm = await banMsg(env, u); if (bm) return json({ error: bm }, 403); }
    await setPassword(env, u.id, np);   // also signs out every device
    await env.DB.prepare("UPDATE users SET email_ok = 1 WHERE id = ?").bind(u.id).run();   // opening the email proves it's theirs
    await env.DB.prepare("DELETE FROM email_tokens WHERE uid = ? AND kind = 'reset'").bind(u.id).run();
    await env.DB.prepare("DELETE FROM login_attempts WHERE k = ?").bind("u:" + u.name.toLowerCase()).run();
    if (u.pk_on) { later(sendMail(env, u.email, "Your Llama Lounge password was reset", [`Hi ${u.name.toUpperCase()}, your password was just reset. You'll still need your passkey to log in.`])); return pkLoginStep(env, url, u); }
    later(sendMail(env, u.email, "Your Llama Lounge password was reset", [`Hi ${u.name.toUpperCase()}, your password was just reset and every other device was logged out.`, "If this wasn't you, reset it again right away and tell a staff member."]));
    const tok = await newSession(env, u.id);
    const nu = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(u.id).first();
    return json(profileOf(env, nu), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  return json({ error: "not found" }, 404);
}

// ---------- spit arena ----------
// 60-second rounds. Everyone who presses PLAY during the countdown (or early in a round) shares the round.
// The server keeps the round clock, relays live moves between the players in it, and pays tokens.
const ARENA = {
  countdown: 4000, dur: 60000, lateJoin: 25000,            // you can still hop into a round with 25s or more left
  maxRate: 12,                                             // points a second nobody can beat (combo x5, frenzy x2)
  dayCap: 40,                                              // most arena tokens a llama can earn in one day
  colors: [["blue", 1], ["green", 2], ["pink", 4], ["gold", 6], ["rainbow", 8], ["fire", 10]],   // spit colours and the level that unlocks each
};
const arenaLevel = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
// TIMED EVENTS: for the first 30 minutes of these Eastern-time hours, one treasure room pays double (the rooms take turns).
const EVENTS = { hours: [9, 12, 15, 18, 21], mins: 30, rooms: ["cove", "jungle"] };
const etHM = (t) => { const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date(t)); const g = (k) => +(p.find((x) => x.type === k) || {}).value || 0; return [g("hour") % 24, g("minute")]; };
function eventNow(now) { const [h, m] = etHM(now), i = EVENTS.hours.indexOf(h); if (i < 0 || m >= EVENTS.mins) return null;
  const day = etDay(now), n = +day.slice(8) + i; return { id: day + ":" + h, kind: "x2", rm: EVENTS.rooms[n % EVENTS.rooms.length], end: now - m * 60000 - (now % 60000) + EVENTS.mins * 60000 }; }
const etDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(t));   // 2026-11-19, Eric's time zone
function etWeek(t) { const d = new Date(etDay(t) + "T12:00:00Z"); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); }   // Monday of the week
const unlocked = (lvl) => ARENA.colors.filter(([, l]) => lvl >= l).map(([c]) => c);

// BOWL-PHYSICS-START (generated from tools/bowl_physics.js by tools/sync_bowl.py; edit that file, not this copy)
// ---- BOWLING PHYSICS (shared: the server runs this exact code to decide which pins fall) ----
// Units are inches and seconds. Only + - * / and Math.sqrt are used, so every browser and the server get the same answer.
const BOWL = { HW: 20.75, BR: 4.3, PR: 2.4, HEAD: 720, WALL: 27, PIT: 772, DT: 1 / 480, MB: 4.3,
  MINX: -16, MAXX: 16, MINV: 230, MAXV: 330, MAXANG: 0.035, HOOK: 16 };
function bowlPins() { const p = []; for (let r = 0; r < 4; r++) for (let j = 0; j <= r; j++) p.push([(j - r / 2) * 12, BOWL.HEAD + r * 10.392]); return p; }
// clean up a throw so it is inside the rules (the server does this too)
function bowlClamp(s) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : 0));
  const vy = Math.round(n(s.vy, BOWL.MINV, BOWL.MAXV) * 1000) / 1000;
  const vx = Math.round(n(s.vx, -vy * BOWL.MAXANG, vy * BOWL.MAXANG) * 1000) / 1000;
  return { x: Math.round(n(s.x, BOWL.MINX, BOWL.MAXX) * 1000) / 1000, vx, vy, spin: Math.round(n(s.spin, -1, 1) * 1000) / 1000 };
}
// standing: 10 flags (1 = pin is up). rec: optional array that gets a snapshot every 4 steps for the animation.
function bowlSim(start, standing, rec) {
  const B = BOWL, dt = B.DT, home = bowlPins();
  const ball = { x: start.x, y: 0, vx: start.vx, vy: start.vy, gut: false };
  const pins = [];
  for (let i = 0; i < 10; i++) if (standing[i]) pins.push({ i, x: home[i][0], y: home[i][1], vx: 0, vy: 0, hit: false, pit: false });
  const R1 = B.BR + B.PR, R2 = B.PR * 2;
  let still = 0, steps = 0;
  for (; steps < 480 * 8; steps++) {
    // the ball: straight on the oily front, hooks on the dry back end, drops in the gutter if it rolls off the lane
    if (ball.y > 280 && ball.y < B.HEAD - 10 && !ball.gut) ball.vx += start.spin * B.HOOK * dt;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (!ball.gut && ball.y < B.HEAD - 14 && (ball.x > B.HW || ball.x < -B.HW)) { ball.gut = true; ball.vx = 0; ball.x = ball.x > 0 ? B.HW + 4.5 : -B.HW - 4.5; }
    if (ball.y > B.PIT + 30) { ball.vx = 0; ball.vy = 0; }
    // ball hits pins
    if (!ball.gut) for (const p of pins) {
      if (p.pit) continue; const dx = p.x - ball.x, dy = p.y - ball.y, d2 = dx * dx + dy * dy;
      if (d2 < R1 * R1) { const d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
        const rv = (ball.vx - p.vx) * nx + (ball.vy - p.vy) * ny;
        if (rv > 0) { const j = 1.55 * rv / (1 / B.MB + 1); ball.vx -= j / B.MB * nx; ball.vy -= j / B.MB * ny; p.vx += j * nx; p.vy += j * ny; p.hit = true; }
        const o = R1 - d; p.x += nx * o; p.y += ny * o; }
    }
    // pins hit each other (a flying pin knocks over a standing one)
    for (let a = 0; a < pins.length; a++) { const p = pins[a]; if (p.pit) continue;
      for (let b = a + 1; b < pins.length; b++) { const q = pins[b]; if (q.pit) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 * R2) { const d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
          const rv = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
          if (rv > 0) { const j = 1.8 * rv / 2; p.vx -= j * nx; p.vy -= j * ny; q.vx += j * nx; q.vy += j * ny; if (j > 5) { p.hit = true; q.hit = true; } }
          const o = (R2 - d) / 2; p.x -= nx * o; p.y -= ny * o; q.x += nx * o; q.y += ny * o; }
      } }
    // pins slide, bounce off the side walls, and drop into the pit
    let moving = ball.vy > 0 && ball.y < B.PIT + 30 ? 1 : 0;
    for (const p of pins) { if (p.pit) continue;
      p.x += p.vx * dt; p.y += p.vy * dt; const f = 1 - 2.2 * dt; p.vx *= f; p.vy *= f;
      if (p.x > B.WALL) { p.x = B.WALL; p.vx = -p.vx * 0.55; } if (p.x < -B.WALL) { p.x = -B.WALL; p.vx = -p.vx * 0.55; }
      if (p.y < B.HEAD - 40) { p.y = B.HEAD - 40; p.vy = -p.vy * 0.3; }
      if (p.y > B.PIT) { p.pit = true; p.hit = true; p.vx = 0; p.vy = 0; }
      if (p.vx * p.vx + p.vy * p.vy > 4) moving = 1; }
    if (rec && steps % 4 === 0) rec.push([Math.round(ball.x * 100) / 100, Math.round(ball.y * 100) / 100, ball.gut ? 1 : 0, pins.map((p) => [p.i, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, p.hit ? 1 : 0, p.pit ? 1 : 0])]);
    still = moving ? 0 : still + 1;
    if (still > 120 && ball.y > B.HEAD) break;
  }
  const home2 = bowlPins();
  const down = pins.filter((p) => p.hit || (p.x - home2[p.i][0]) * (p.x - home2[p.i][0]) + (p.y - home2[p.i][1]) * (p.y - home2[p.i][1]) > 6.25).map((p) => p.i);
  return { down, gutter: ball.gut, steps };
}
// ---- 5-frame scoring (the last frame gets bonus balls after a strike or spare) ----
const BOWL_FRAMES = 5;
function bowlScore(rolls) {
  const frames = []; let i = 0, total = 0;
  for (let f = 0; f < BOWL_FRAMES; f++) {
    const last = f === BOWL_FRAMES - 1, a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
    if (a === undefined) { frames.push({ marks: [], score: null }); continue; }
    if (!last) {
      if (a === 10) { const ok = b !== undefined && c !== undefined; if (ok) total += 10 + b + c; frames.push({ marks: ['X'], score: ok ? total : null }); i += 1; continue; }
      if (b === undefined) { frames.push({ marks: [mk(a)], score: null }); i += 1; continue; }
      if (a + b === 10) { const ok = c !== undefined; if (ok) total += 10 + c; frames.push({ marks: [mk(a), '/'], score: ok ? total : null }); i += 2; continue; }
      total += a + b; frames.push({ marks: [mk(a), mk(b)], score: total }); i += 2; continue;
    }
    // last frame: up to three balls
    const m = [a === 10 ? 'X' : mk(a)];
    if (b !== undefined) m.push(a === 10 ? (b === 10 ? 'X' : mk(b)) : (a + b === 10 ? '/' : mk(b)));
    if (c !== undefined) m.push(a === 10 && b !== 10 ? (b + c === 10 ? '/' : mk(c)) : (c === 10 ? 'X' : mk(c)));
    const needs = (a === 10 || (b !== undefined && a + b === 10)) ? 3 : 2;
    const have = [a, b, c].filter((v) => v !== undefined).length;
    if (have >= needs) total += a + (b || 0) + (needs === 3 ? (c || 0) : 0);
    frames.push({ marks: m, score: have >= needs ? total : null }); i += have;
  }
  return { frames, total };
  function mk(v) { return v === 0 ? '-' : String(v); }
}
// where the game is: which frame, which ball, which pins are standing, and whether it's over
function bowlState(rolls) {
  let i = 0, standing = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  for (let f = 0; f < BOWL_FRAMES; f++) {
    const last = f === BOWL_FRAMES - 1;
    if (!last) {
      if (rolls[i] === undefined) return { frame: f, ball: 0, done: false };
      if (rolls[i] === 10) { i += 1; continue; }
      if (rolls[i + 1] === undefined) return { frame: f, ball: 1, done: false };
      i += 2; continue;
    }
    const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
    if (a === undefined) return { frame: f, ball: 0, done: false };
    if (b === undefined) return { frame: f, ball: 1, done: false, fresh: a === 10 };
    const extra = a === 10 || a + b === 10;
    if (!extra) return { frame: f, ball: 2, done: true };
    if (c === undefined) return { frame: f, ball: 2, done: false, fresh: (a === 10 && b === 10) || (a !== 10 && a + b === 10) };
    return { frame: f, ball: 3, done: true };
  }
  return { frame: BOWL_FRAMES, ball: 0, done: true };
}
// BOWL-PHYSICS-END

// ---------- dunk tank (Llama Acres) ----------
// A throw costs 1 coin; a bullseye dunks whoever is on the seat and pays 3. Whoever volunteers on the seat earns 1 per dunk.
const DUNK = { seat: [3, 6], target: [3, 8], cost: 1, prize: 3, sitPay: 1, gap: 2500, winCap: 30, sitCap: 15 };

// ---------- hay bale bowling ----------
// The server keeps each player's game, runs the same physics as the page to decide pinfall, and pays coins at the end.
const LANES = { minGap: 2200, dayCap: 40, expire: 30 * 60000 };

// ---------- realtime room ----------
const PRES_KEYS = new Set(["bj", "c", "n", "x", "y", "d", "p", "m", "s", "h", "hl", "sk", "e", "a", "sp", "td", "g", "fk", "rm", "fs", "sl", "j", "l", "ea"]);
// ---- word filter (the same copy lives in src/worker.js and public/index.html) ----
// SLURS: a message with one of these isn't sent at all. SWEARS: masked with stars in chat and DMs.
// Names and room names can't contain either. Checks see through leetspeak (n1gg3r), repeated letters,
// accents, and spaced-out letters (f a g). Words match whole (with -s/-es/-ed/-ing endings) unless listed in *_ROOT,
// which also match inside longer words (motherfucker).
const WF = (() => {
  const SLUR_ROOT = ["nigger", "nigga", "niggah", "nigguh", "niglet", "faggot", "fagot", "wetback", "towelhead", "raghead", "sandnigger", "porchmonkey", "jigaboo", "zipperhead", "golliwog", "kneegrow", "heilhitler", "siegheil", "whitepower", "gasthejews", "killalljews", "tranny", "trannies", "shemale", "retard"];
  const SLUR_WORD = ["fag", "fags", "faggy", "dyke", "chink", "chinks", "gook", "gooks", "spic", "spick", "spics", "kike", "kyke", "kikes", "beaner", "beaners", "coon", "coons", "wog", "wogs", "paki", "pakis", "negro", "negroes", "jap", "japs", "gyppo", "pikey", "darkie", "darky", "camel jockey", "mongoloid", "spaz", "spastic"];
  const SWEAR_ROOT = ["fuck", "fuk", "fck", "shit", "bitch", "cunt", "asshole", "motherf", "whore", "slut", "dickhead", "cocksucker", "wanker", "twat", "bollock", "pussy", "jackass", "dumbass", "fatass", "bullshit", "porn", "jizz", "blowjob", "handjob"];
  const SWEAR_WORD = ["ass", "asses", "arse", "dick", "dicks", "cock", "cocks", "tits", "titties", "boobs", "cum", "bastard", "bastards", "prick", "piss", "pissed", "damnit", "goddamn", "skank", "hoe", "hoes", "rape", "raped", "rapist", "nude", "nudes", "sex", "sexy", "penis", "vagina", "dildo", "milf", "thot", "wtf", "stfu", "fml", "kys"];
  const LEET = { "0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a", "5": "s", "$": "s", "7": "t", "+": "t", "8": "b", "9": "g", "6": "g", "2": "z", "€": "e", "£": "l" };
  const letters = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[0-9!|@$+€£]/g, (c) => LEET[c] || c).replace(/[^a-z]/g, "");
  const pat = (w) => w.replace(/[^a-z]/g, "").split("").map((c) => c + "+").join("");   // n+i+g+g+e+r+ : any number of each letter, but never fewer
  const rx = (list, whole) => new RegExp(whole ? "^(?:" + list.map(pat).join("|") + ")(?:e?s|e?d|ing)?$" : "(?:" + list.map(pat).join("|") + ")");
  const slurRoot = rx(SLUR_ROOT), slurWord = rx(SLUR_WORD.filter((w) => !w.includes(" ")), true), swearRoot = rx(SWEAR_ROOT), swearWord = rx(SWEAR_WORD, true);
  const slurPhrase = rx(SLUR_WORD.filter((w) => w.includes(" ")));
  // the words of a message (letters only), plus runs of single letters joined up ("f a g" -> "fag")
  const words = (text) => { const raw = String(text).split(/[\s_.,;:\-*~/\\()[\]{}"'`^#%&=<>?]+/).map(letters).filter(Boolean), out = raw.slice(); let run = "";
    for (const w of raw) { if (w.length === 1) run += w; else { if (run.length > 1) out.push(run); run = ""; } } if (run.length > 1) out.push(run); return out; };
  const isSlurWord = (w) => slurRoot.test(w) || slurWord.test(w);
  const isSwearWord = (w) => swearRoot.test(w) || swearWord.test(w);
  return {
    // true if the text has a slur anywhere (also caught when letters are spread over several words: "nig ger")
    slur(text) { const ws = words(text); return ws.some(isSlurWord) || slurRoot.test(letters(text)) || slurPhrase.test(letters(text)); },
    // chat and DMs: swear words become stars (same length), everything else stays as typed
    mask(text) { return String(text).replace(/[^\s]+/g, (tok) => { const w = letters(tok); return w && (isSwearWord(w) || isSlurWord(w)) ? "*".repeat(Math.min(tok.length, 12)) : tok; }); },
    // names and room names: no slurs and no swears, even inside other letters ("xxfuckxx")
    nameOk(text) { const l = letters(text), ws = words(text); return !(this.slur(text) || swearRoot.test(l) || ws.some(isSwearWord)); },
  };
})();

function cleanPresence(p, name, tk, muted, staff) {
  const o = {};
  if (!p || typeof p !== "object") return o;
  for (const k of Object.keys(p)) if (PRES_KEYS.has(k)) o[k] = p[k];
  o.n = name; o.tk = tk; if (staff) o.st = staff; else delete o.st;   // the server decides who you are, what you hold and your staff badge
  if (o.s && typeof o.s === "object") { o.s = { k: +o.s.k || 0, t: String(o.s.t || "").slice(0, 120), y: o.s.y ? 1 : 0, f: o.s.f ? 1 : 0 }; if (muted) delete o.s;
    else if (WF.slur(o.s.t)) delete o.s; else o.s.t = WF.mask(o.s.t); }   // every line, action lines too (the flag comes from the browser, so it can't skip the filter): slurs never go out; swears go out as stars
  if (JSON.stringify(o).length > 3000) return { c: o.c, n: name, x: o.x, y: o.y, d: o.d, p: o.p, m: o.m, rm: o.rm, tk, ...(staff ? { st: staff } : {}) };
  return o;
}

// the parts of a llama's presence that every room shows (chat log, who is where, outfit, tokens, scores, jukebox, lamp).
// When none of these changed, the update is just movement and only goes to the llama's own room.
// THE WAITING LINE: at most this many llamas play at once (the owner can change it in DASHBOARD > ERRORS > SERVER HEALTH). Extra visitors wait in line
// and are let in, first come first served, as others leave. Staff skip the line; someone whose connection blipped gets straight back in.
const MAX_PLAYERS_DEFAULT = 200, QUEUE_GRACE_MS = 120000;
const PRES_BATCH_MS = 100;
const ACT_LIMIT = { burstMs: 2000, burst: 24, perMin: 300 };   // per connection, across every action
const HEALTH = { everyMs: 5 * 60000, slowMs: 1500, keepMs: 7 * 86400000, keepLog: 200 };
const presSig = (p) => { const s = JSON.stringify([p.rm, p.c, p.n, p.st || "", p.w || 0, p.tk, p.s ? p.s.k : 0, p.g ? p.g.k : 0, p.j ? p.j.ts : 0, p.l ? p.l.ts : 0]); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h; };   // a short hash, so it stays small in the socket attachment
const fmtDur = (ms) => { const m = Math.ceil(ms / 60000); return m >= 120 ? `${Math.round(m / 6) / 10} hours`.replace(".0 ", " ") : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
// what a player can report someone for (the key is stored; staff see the label)
const REPORT_REASONS = { rude: "Rude or bullying", hate: "Hate speech or slurs", spam: "Spam", scam: "Scam or trade trouble", name: "Bad name, room or outfit", other: "Something else" };

export class Lounge extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.tables = [null, null];   // live table games (lost if the room ever sleeps, which only happens when it's empty)
    try { this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong")); } catch (e) {}   // keep-alive check from the page, answered without waking the room
    this.qc = new WeakMap();      // socket -> waiting in line?
    this.recent = new Map();      // uid -> when they last left (a quick reconnect skips the line)
    this.qkeep = new Map();       // uid -> their place in line, kept for a couple of minutes if their connection blips
    this.rmc = new WeakMap();     // socket -> room id, so movement can be sent per room without re-reading every attachment
    this.pend = new Map();        // peer -> socket with movement waiting for the next batch
    this.flushT = null;
  }

  async fetch(req) {
    const uid = +req.headers.get("x-uid"), name = req.headers.get("x-name"), staff = ["owner", "mod"].includes(req.headers.get("x-staff")) ? req.headers.get("x-staff") : "";
    // one llama per account: an older connection for this account (another tab, or one left over from a reload) is closed and removed for everyone
    let held = false;   // this account already had a playing connection (another tab, or one being replaced)
    for (const w of this.allSockets()) { const old = w.deserializeAttachment(); if (!old || old.uid !== uid) continue; if (!old.q) held = true;
      if (old.pres) this.broadcast({ t: "peers", left: [{ peer: old.peer }] }, w);
      this.pend.delete(old.peer); this.rmc.set(w, null); this.qc.set(w, true);   // counted out from here on
      try { w.serializeAttachment({ ...old, pres: null }); w.close(4001, "replaced"); } catch (e) {} }
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    const peer = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    this.ctx.acceptWebSocket(server);
    const nd = await this.needsLoad(uid);
    const wear = await this.wearLoad(uid);
    const now = Date.now(), att = { uid, name, staff, peer, pres: null, rate: [now, 0], nd, wear, act: now };
    // full? then this llama waits in line (the socket stays open so it can be told its place and let in the moment there's room)
    const cap = await this.capNow(), playing = this.sockets().filter((w) => w !== server && w.readyState === 1).length;
    const back = held || (this.recent.get(uid) || 0) > now - QUEUE_GRACE_MS;
    if (!staff && !back && playing >= cap) { const kept = this.qkeep.get(uid); att.q = kept && kept.t > now - QUEUE_GRACE_MS ? kept.q : now; this.qkeep.delete(uid);
      server.serializeAttachment(att); this.qc.set(server, true); await this.queuePump(); return new Response(null, { status: 101, webSocket: client }); }
    server.serializeAttachment(att); this.qc.set(server, false);
    await this.hello(server, att);
    return new Response(null, { status: 101, webSocket: client });
  }

  // everyone PLAYING. Llamas waiting in line are connected too, but nothing in the game is sent to them and they can't do anything yet.
  allSockets() { return this.ctx.getWebSockets(); }
  isQ(w) { let q = this.qc.get(w); if (q === undefined) { const x = w.deserializeAttachment(); q = !!(x && x.q); this.qc.set(w, q); } return q; }
  sockets() { return this.ctx.getWebSockets().filter((w) => !this.isQ(w)); }
  async capNow() { if (this.cap === undefined) { let v = 0; try { v = +(await this.ctx.storage.get("cap")) || 0; } catch (e) {} this.cap = v >= 1 ? v : MAX_PLAYERS_DEFAULT; } return this.cap; }
  // greet a llama that is in: everyone already here, the leaderboard and its meters
  async hello(server, a) {
    const peers = this.sockets().filter((w) => w !== server && w.readyState === 1).map((w) => w.deserializeAttachment()).filter((x) => x && x.pres && x.uid !== a.uid).map((x) => ({ peer: x.peer, presence: (prId(x.pres.rm) && (!this.prPriv || this.prPriv.get(prId(x.pres.rm)) !== false)) ? { ...x.pres, s: undefined, e: undefined } : x.pres }));   // never show what's said in a private room
    this.send(server, { t: "hello", now: Date.now(), v: VERSION, peer: a.peer, peers, ev: eventNow(Date.now()), board: await this.board(), nd: a.nd ? { hu: a.nd.hu, th: a.nd.th, rate: { hu: 100 / NEEDS.hungerMs, th: 100 / NEEDS.thirstMs } } : undefined });
  }
  // let waiting llamas in while there is room (longest wait first), then tell the rest their place
  async queuePump() {
    const all = this.ctx.getWebSockets().filter((w) => w.readyState === 1), Q = all.filter((w) => this.isQ(w)).map((w) => [w, w.deserializeAttachment()]).filter(([, x]) => x && x.q).sort((x, y) => x[1].q - y[1].q);
    if (!Q.length) return; let playing = all.length - Q.length; const cap = await this.capNow();
    while (Q.length && playing < cap) { const [w, x] = Q.shift(); delete x.q; x.rate = [Date.now(), 0]; w.serializeAttachment(x); this.qc.set(w, false); playing++; await this.hello(w, x); }
    Q.forEach(([w], i) => this.send(w, { t: "queue", pos: i + 1, of: Q.length }));
  }
  queueLen() { return this.ctx.getWebSockets().filter((w) => w.readyState === 1 && this.isQ(w)).length; }
  // presence goes to everyone, but what's said inside a private player room only reaches the people in it
  peersOut(ws, a, kind) {
    const full = JSON.stringify({ t: "peers", [kind]: [{ peer: a.peer, presence: a.pres }] });
    const id = prId(a.pres && a.pres.rm);
    if (!id || !(this.prPriv && this.prPriv.get(id))) { for (const w of this.sockets()) if (w !== ws) { try { w.send(full); } catch (e) {} } return; }
    const lite = JSON.stringify({ t: "peers", [kind]: [{ peer: a.peer, presence: { ...a.pres, s: undefined, e: undefined } }] });
    for (const w of this.sockets()) { if (w === ws) continue; const x = w.deserializeAttachment(); try { w.send(x && x.pres && x.pres.rm === a.pres.rm ? full : lite); } catch (e) {} }
  }
  // which room a socket's llama is in (null before it has joined); cached, and rebuilt from the attachment after a sleep
  rmOf(w) { let r = this.rmc.get(w); if (r === undefined) { const x = w.deserializeAttachment(); r = x && x.pres ? x.pres.rm : null; this.rmc.set(w, r); } return r; }
  // MOVEMENT IS PER ROOM AND BATCHED. Steps, turns, sitting, emotes and the like only matter to llamas in the same room, so they wait
  // up to PRES_BATCH_MS and go out as one bundle per room. Anything the whole world shows (chat, changing room, outfit, tokens, scores,
  // the jukebox) still goes to everyone straight away through peersOut.
  queueMove(ws, a) { this.pend.set(a.peer, ws); if (!this.flushT) this.flushT = setTimeout(() => { this.flushT = null; try { this.flushMoves(); } catch (e) { console.error("flush", e); } }, PRES_BATCH_MS); }
  flushMoves() {
    if (!this.pend.size) return;
    const byRoom = new Map();
    for (const [peer, w] of this.pend) { if (w.readyState !== 1) continue; const x = w.deserializeAttachment(); if (!x || !x.pres || x.peer !== peer) continue;
      let L = byRoom.get(x.pres.rm); if (!L) byRoom.set(x.pres.rm, L = []); L.push({ peer, presence: x.pres, w }); }
    this.pend.clear(); if (!byRoom.size) return;
    const strip = (L) => JSON.stringify({ t: "peers", updated: L.map((e) => ({ peer: e.peer, presence: e.presence })) });
    const whole = new Map(); for (const [rm, L] of byRoom) whole.set(rm, strip(L));
    for (const w of this.sockets()) { if (w.readyState !== 1) continue; const rm = this.rmOf(w);
      if (rm === null) { for (const sAll of whole.values()) { try { w.send(sAll); } catch (e) {} } continue; }   // not joined yet: still watching, so it sees every room
      const L = byRoom.get(rm); if (!L) continue;
      const mine = L.some((e) => e.w === w);
      if (!mine) { try { w.send(whole.get(rm)); } catch (e) {} continue; }
      if (L.length > 1) { try { w.send(strip(L.filter((e) => e.w !== w))); } catch (e) {} } }
  }
  // everyone already in a room, sent to a llama that just walked in (it stopped getting their steps while it was elsewhere)
  roomSnapshot(ws, rm) { const L = [];
    for (const w of this.sockets()) { if (w === ws || w.readyState !== 1 || this.rmOf(w) !== rm) continue; const x = w.deserializeAttachment(); if (x && x.pres) L.push({ peer: x.peer, presence: x.pres }); }
    if (L.length) this.send(ws, { t: "peers", updated: L }); }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
  // to everyone in one room
  roomCast(rm, obj) { const str = JSON.stringify(obj); for (const w of this.sockets()) if (this.rmOf(w) === rm) { try { w.send(str); } catch (e) {} } }
  // announce a timed event when it starts and when it ends (checked every few seconds while anyone is around)
  eventTick(now) { const ev = eventNow(now), id = ev ? ev.id : ""; if (this.evId === undefined) { this.evId = id; if (!ev) return; } else if (id === this.evId) return; this.evId = id; this.broadcast({ t: "ev", ev }); }
  broadcast(obj, except) { const s = JSON.stringify(obj); for (const w of this.sockets()) if (w !== except) { try { w.send(s); } catch (e) {} } }

  async webSocketMessage(ws, raw) {
    if (raw === "ping") { try { ws.send("pong"); } catch (e) {} return; }
    const a = ws.deserializeAttachment(); if (!a) return;
    if (a.q) return;   // still waiting in line
    // simple flood control: 40 messages a second per connection
    const now = Date.now(); const H = this.hInit(); H.msgs++; if (now - a.rate[0] > 1000) a.rate = [now, 0]; a.rate[1]++; if (a.rate[1] > 40) { H.drop++; ws.serializeAttachment(a); return; }
    let m; try { m = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    if (now - H.t0 >= HEALTH.everyMs) { try { await this.healthTick(now); } catch (e) {} }
    if (now - (this.evT || 0) > 10000) { this.evT = now; try { this.eventTick(now); } catch (e) {} }   // a health sample every few minutes, whatever kind of message this is

    if (a.nd) await this.needsTick(ws, a, now);
    if (m.t === "p") {
      // balance / mute / ban are cached for a few seconds so moving around doesn't hit the database every step
      if (!a.uc || now - a.uc.t > 15000){ const u = await this.user(a.uid); if (!u || u.banned) { ws.close(4003, "banned"); return; } a.uc = { t: now, tk: u.tk, muted: u.muted, c: u.c || null }; a.staff = staffRole(this.env, u); }
      const first = !a.pres;
      if (m.p && prId(m.p.rm) && prId(m.p.rm) !== a.proom) return;   // you have to be let in (pr_enter) before you can be in a player room
      // anything a person does (walking, changing rooms, chatting) counts as being here
      if (m.p && (first || +m.p.x !== a.pres.x || +m.p.y !== a.pres.y || m.p.rm !== a.pres.rm || (m.p.s && typeof m.p.s === "object" && +m.p.s.k !== a.ck))) a.act = now;
      // chat log for staff: every new line, muted ones too (marked); action lines like "sat down" are marked as actions
      const rs = m.p && m.p.s;
      // chat flood limit: at most 8 new lines every 5 seconds; extra lines are dropped (not shown, not logged)
      if (rs && typeof rs === "object" && rs.t && +rs.k !== a.ck && !first) { if (!a.cr || now - a.cr[0] > 5000) a.cr = [now, 0];
        if (++a.cr[1] > 8) { a.ck = +rs.k; delete m.p.s; if (a.cr[1] === 9) this.send(ws, { t: "toast", msg: "Slow down a little. Some of your messages weren't sent." }); } }
      if (rs && typeof rs === "object" && rs.t && m.p.s && +rs.k !== a.ck) { const was = a.ck; a.ck = +rs.k; const bad = WF.slur(String(rs.t)); if (bad) this.send(ws, { t: "filtered" });
        if (!first && was !== undefined && !rs.f && (bad || WF.mask(String(rs.t)) !== String(rs.t))) await this.wfHit(ws, a, bad ? "blocked" : "masked");
        if (!first && was !== undefined) { await this.chatLog(a, m.p.rm, (bad ? "BLOCKED: " : rs.f ? "* " : "") + String(rs.t).slice(0, 120), !!a.uc.muted); if (!rs.f && !a.uc.muted && !bad) { try { await this.questTick(ws, a.uid, "chat"); } catch (e) {} } } }
      else if (first && rs && typeof rs === "object") a.ck = +rs.k;
      if (first && a.ck === undefined) a.ck = 0;
      if (a.pres && m.p && m.p.rm !== a.pres.rm) this.tradeDrop(a.uid, `${a.name} left the room, so the trade was cancelled.`);
      const prevRm = a.pres ? a.pres.rm : null, prevSig = a.gs;
      const prevSit = a.pres && a.pres.p === "sit" ? a.pres.rm + ":" + Math.floor(a.pres.x) + "," + Math.floor(a.pres.y) : null;
      a.pres = cleanPresence(m.p, a.name, a.uc.tk, !!a.uc.muted, a.staff); if (a.uc.c) a.pres.c = a.uc.c;   // everyone sees the llama the account picked
      // one llama per seat: whoever sat down first keeps it
      if (a.pres.p === "sit" && Number.isFinite(a.pres.x) && Number.isFinite(a.pres.y)) { const key = a.pres.rm + ":" + Math.floor(a.pres.x) + "," + Math.floor(a.pres.y);
        if (key !== prevSit) for (const w2 of this.sockets()) { if (w2 === ws) continue; const x = w2.deserializeAttachment(); const q = x && x.pres;
          if (q && q.p === "sit" && q.rm === a.pres.rm && Math.floor(q.x) === Math.floor(a.pres.x) && Math.floor(q.y) === Math.floor(a.pres.y)) { a.pres.p = "stand"; this.send(ws, { t: "seattaken" }); break; } } }
      if (a.wear && Object.keys(a.wear).length) a.pres.w = a.wear;   // and the clothes it owns and has on
      a.gs = presSig(a.pres);
      ws.serializeAttachment(a); this.rmc.set(ws, a.pres.rm);
      { const pid = prId(a.pres.rm); if (pid && !(this.prPriv && this.prPriv.has(pid))) await this.prRoom(pid); }   // know if it's private before sending anything
      if (first || a.gs !== prevSig) { this.pend.delete(a.peer); this.peersOut(ws, a, first ? "joined" : "updated"); }   // the whole world shows this change
      else this.queueMove(ws, a);                                                                                       // only this room cares
      if (first || prevRm !== a.pres.rm) this.roomSnapshot(ws, a.pres.rm);
      return;
    }
    if (m.t === "ar") { this.arenaRelay(ws, a, m, now); return; }
    if (m.t === "act") {
      // EVERY action is rate limited per connection, whatever it is: a short burst allowance and a per-minute cap.
      // (Many actions also have their own cooldowns and daily caps; this is the floor under all of them.)
      const ar = a.ar && a.ar.length === 4 ? a.ar : [now, 0, now, 0];
      if (now - ar[0] > ACT_LIMIT.burstMs) { ar[0] = now; ar[1] = 0; } if (now - ar[2] > 60000) { ar[2] = now; ar[3] = 0; }
      ar[1]++; ar[3]++; a.ar = ar;
      if (ar[1] > ACT_LIMIT.burst || ar[3] > ACT_LIMIT.perMin) { H.drop++; ws.serializeAttachment(a); this.send(ws, { t: "res", id: m.id, ok: false, msg: "Slow down a little and try again." }); return; }
      ws.serializeAttachment(a);
      let res; const t0 = Date.now(), an = String(m.a || "").slice(0, 40); H.acts++;
      try { res = await this.act(ws, a, String(m.a || ""), m); } catch (e) { console.error(e); H.errs++; res = { ok: false, msg: "Server hiccup, try again." }; try { await this.healthNote("error", an, Date.now() - t0, String((e && e.stack) || e).slice(0, 700)); } catch (e2) {} }
      { const ms = Date.now() - t0; if (ms > HEALTH.slowMs) { H.slow++; try { await this.healthNote("slow", an, ms, ""); } catch (e2) {} } }
      try { await this.healthTick(Date.now()); } catch (e2) {}
      if (res && res.ok) { const qk = questKeyFor(String(m.a || ""), res); if (qk) { try { await this.questTick(ws, a.uid, qk); } catch (e) { console.error("quest", e); } } }
      if (res && Number.isFinite(res.tk)) { const a2 = ws.deserializeAttachment(); if (a2) { a2.uc = { ...(a2.uc || {}), t: Date.now(), tk: res.tk, muted: a2.uc ? a2.uc.muted : 0 }; ws.serializeAttachment(a2); } }
      this.send(ws, { t: "res", id: m.id, ...res });
    }
  }

  async webSocketClose(ws) { this.left(ws); try { ws.close(1000, "bye"); } catch (e) {} this.qc.set(ws, true); try { await this.queuePump(); } catch (e) {}   // finish the closing handshake, so the page knows at once and can reconnect
    try { const a = ws.deserializeAttachment(); if (a && a.nd) { this.needsDrain(a, Date.now()); await this.needsSave(a); } } catch (e) {} }
  async webSocketError(ws) { this.left(ws); this.qc.set(ws, true); try { await this.queuePump(); } catch (e) {} }
  left(ws) { const a = ws.deserializeAttachment(); if (a) { this.pend.delete(a.peer); const now = Date.now(); if (a.q) this.qkeep.set(a.uid, { q: a.q, t: now }); else this.recent.set(a.uid, now);
      if (this.recent.size > 2000) for (const [k, v] of this.recent) if (v < now - QUEUE_GRACE_MS) this.recent.delete(k); if (this.qkeep.size > 2000) for (const [k, v] of this.qkeep) if (v.t < now - QUEUE_GRACE_MS) this.qkeep.delete(k); }
    this.rmc.set(ws, null); if (a && a.q) return; if (a && a.pres) this.broadcast({ t: "peers", left: [{ peer: a.peer }] }, ws); if (a) this.tradeDrop(a.uid, `${a.name} left, so the trade was cancelled.`); }

  // ---------- player rooms ----------
  async prTables() { if (this.prReady) return;
    for (const q of ["CREATE TABLE IF NOT EXISTS prooms (id INTEGER PRIMARY KEY AUTOINCREMENT, owner INTEGER NOT NULL, name TEXT NOT NULL, priv INTEGER NOT NULL DEFAULT 0, wall TEXT NOT NULL DEFAULT 'lavender', floor TEXT NOT NULL DEFAULT 'wood', t INTEGER NOT NULL)",
      "CREATE TABLE IF NOT EXISTS pinv (room INTEGER NOT NULL, uid INTEGER NOT NULL, PRIMARY KEY (room, uid))",
      "CREATE TABLE IF NOT EXISTS pfurn (id INTEGER PRIMARY KEY AUTOINCREMENT, room INTEGER NOT NULL, item TEXT NOT NULL, gx INTEGER NOT NULL, gy INTEGER NOT NULL, rot INTEGER NOT NULL DEFAULT 0)",
      "CREATE INDEX IF NOT EXISTS pfurn_room ON pfurn (room)",
      "CREATE TABLE IF NOT EXISTS finv (uid INTEGER NOT NULL, item TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (uid, item))",
      "CREATE TABLE IF NOT EXISTS deco (uid INTEGER NOT NULL, k TEXT NOT NULL, PRIMARY KEY (uid, k))",
      "CREATE TABLE IF NOT EXISTS plike (room INTEGER NOT NULL, uid INTEGER NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (room, uid))"]) await this.env.DB.prepare(q).run();
    try { await this.env.DB.prepare("ALTER TABLE prooms ADD COLUMN feat INTEGER NOT NULL DEFAULT 0").run(); } catch (e) {}   // rooms the owner features in the room browser
    try { await this.env.DB.prepare("ALTER TABLE pfurn ADD COLUMN off INTEGER NOT NULL DEFAULT 0").run(); } catch (e) {}
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS pplot (fid INTEGER PRIMARY KEY, room INTEGER NOT NULL, crop TEXT NOT NULL, planted INTEGER NOT NULL, ready INTEGER NOT NULL, wat INTEGER NOT NULL DEFAULT 0, wby TEXT)").run();   // TVs and lamps can be switched off (already there after the first time)
    // one llama can own several rooms now: rebuild prooms once without the UNIQUE on owner (ids stay the same, so furniture, likes and invites stay put)
    { const t = await this.env.DB.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'prooms'").first();
      if (t && /owner INTEGER NOT NULL UNIQUE/i.test(t.sql)) await this.env.DB.batch([
        this.env.DB.prepare("CREATE TABLE prooms_new (id INTEGER PRIMARY KEY AUTOINCREMENT, owner INTEGER NOT NULL, name TEXT NOT NULL, priv INTEGER NOT NULL DEFAULT 0, wall TEXT NOT NULL DEFAULT 'lavender', floor TEXT NOT NULL DEFAULT 'wood', t INTEGER NOT NULL, feat INTEGER NOT NULL DEFAULT 0)"),
        this.env.DB.prepare("INSERT INTO prooms_new (id, owner, name, priv, wall, floor, t, feat) SELECT id, owner, name, priv, wall, floor, t, feat FROM prooms"),
        this.env.DB.prepare("DROP TABLE prooms"),
        this.env.DB.prepare("ALTER TABLE prooms_new RENAME TO prooms"),
        this.env.DB.prepare("CREATE INDEX IF NOT EXISTS prooms_owner ON prooms (owner)")]); }
    // (after the rebuild above, which only carries the original columns: on a brand-new database these would otherwise be lost)
    for (const col of ["kind TEXT NOT NULL DEFAULT 'room'", "pwh TEXT", "pws TEXT"]) { try { await this.env.DB.prepare("ALTER TABLE prooms ADD COLUMN " + col).run(); } catch (e) {} }   // kind: room, plot or farm; pwh/pws: password hash and salt
    // old wallpaper/floor unlocks become bag items (the one already up in the room stays on the wall); runs until the old table is empty
    await this.env.DB.batch([
      this.env.DB.prepare("INSERT INTO finv (uid, item, n) SELECT d.uid, CASE WHEN substr(d.k, 1, 2) = 'w:' THEN 'wp_' || substr(d.k, 3) ELSE 'fl_' || substr(d.k, 3) END, 1 FROM deco d WHERE NOT EXISTS (SELECT 1 FROM prooms r WHERE r.owner = d.uid AND (d.k = 'w:' || r.wall OR d.k = 'f:' || r.floor)) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1"),
      this.env.DB.prepare("DELETE FROM deco")]);
    this.prReady = true; this.prPriv = this.prPriv || new Map(); this.letIn = this.letIn || new Map(); this.knocks = this.knocks || new Map(); }
  async prRoom(id) { await this.prTables(); const r = await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.id = ?").bind(id).first(); if (r) this.prPriv.set(r.id, !!r.priv); return r; }
  async prCanEnter(a, r) {
    if (!r) return false; if (r.owner === a.uid || !r.priv) return true;
    if (a.staff === "owner" || a.staff === "mod") return true;
    const li = this.letIn.get(r.id); if (li && (li.get(a.uid) || 0) > Date.now()) return true;
    return !!(await this.env.DB.prepare("SELECT 1 FROM pinv WHERE room = ? AND uid = ?").bind(r.id, a.uid).first());
  }
  prOut(r) { return { id: r.id, name: r.name, owner: r.oname.toUpperCase(), priv: !!r.priv, wall: r.wall, floor: r.floor, likes: r.likes || 0, liked: !!r.liked, feat: !!r.feat, farm: r.kind === "farm", kind: r.kind === "farm" || r.kind === "plot" ? r.kind : "room", open: prOpen(r), pw: !!(r.priv && r.pwh) }; }
  async prLikes(id, uid) { const r = await this.env.DB.prepare("SELECT (SELECT COUNT(*) FROM plike WHERE room = ?) AS likes, EXISTS(SELECT 1 FROM plike WHERE room = ? AND uid = ?) AS liked").bind(id, id, uid).first(); return { likes: r.likes || 0, liked: !!r.liked }; }
  // like or unlike someone else's room: only while you're inside it, never your own, a few times a minute at most
  async prLike(ws, a, m) {
    await this.prTables();
    const rid = Math.floor(+m.rid || 0); if (!rid || a.proom !== rid || !a.pres || a.pres.rm !== "p:" + rid) return { ok: false, msg: "Walk into the room to like it." };
    const r = await this.prRoom(rid); if (!r) return { ok: false, msg: "That room doesn't exist anymore." };
    if (r.owner === a.uid) return { ok: false, msg: "You can't like your own room. Get your friends to!" };
    const now = Date.now(); if (!a.lk || now - a.lk[0] > 60000) a.lk = [now, 0]; if (++a.lk[1] > 10) { ws.serializeAttachment(a); return { ok: false, msg: "Easy on the hearts!" }; } ws.serializeAttachment(a);
    const had = await this.env.DB.prepare("SELECT 1 FROM plike WHERE room = ? AND uid = ?").bind(rid, a.uid).first();
    if (had) await this.env.DB.prepare("DELETE FROM plike WHERE room = ? AND uid = ?").bind(rid, a.uid).run();
    else await this.env.DB.prepare("INSERT OR IGNORE INTO plike (room, uid, t) VALUES (?, ?, ?)").bind(rid, a.uid, now).run();
    const L = await this.prLikes(rid, a.uid); this.toRoom("p:" + rid, { t: "prlikes", room: rid, likes: L.likes });
    return { ok: true, ...L };
  }
  async prFeature(a, m) {   // the owner (users.role = 'admin') picks rooms to feature at the top of the room browser
    const u = await this.user(a.uid); if (staffRole(this.env, u) !== "owner") return { ok: false, msg: "Only the owner can feature rooms." };
    await this.prTables(); const rid = Math.floor(+m.rid || 0);
    await this.env.DB.prepare("UPDATE prooms SET feat = ? WHERE id = ?").bind(m.on ? 1 : 0, rid).run();
    await this.logStaff(a.name, m.on ? "feature" : "unfeature", String(rid)); return this.prList(a);
  }
  prCount(id) { const rm = "p:" + id, seen = new Set(); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === rm) seen.add(x.uid); } return seen.size; }
  toRoom(rm, obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === rm) { try { w.send(s); } catch (e) {} } } }
  async prFurn(id) { return ((await this.env.DB.prepare("SELECT f.id, f.item, f.gx, f.gy, f.rot, f.off, p.crop, p.planted, p.ready, p.wat, p.wby FROM pfurn f LEFT JOIN pplot p ON p.fid = f.id WHERE f.room = ? ORDER BY f.id").bind(id).all()).results || []).filter((f) => FURN_ITEMS[f.item]).map((f) => { if (!f.crop) { delete f.crop; delete f.planted; delete f.ready; delete f.wat; delete f.wby; } return f; }); }
  async prList(a) {
    await this.prTables(); await this.frTable();
    const rows = (await this.env.DB.prepare(`SELECT r.*, u.name AS oname,
        EXISTS(SELECT 1 FROM friends f WHERE f.st = 'ok' AND ((f.a = ? AND f.b = r.owner) OR (f.b = ? AND f.a = r.owner))) AS fr,
        EXISTS(SELECT 1 FROM pinv i WHERE i.room = r.id AND i.uid = ?) AS inv,
        (SELECT COUNT(*) FROM plike l WHERE l.room = r.id) AS likes, EXISTS(SELECT 1 FROM plike l WHERE l.room = r.id AND l.uid = ?) AS liked
      FROM prooms r JOIN users u ON u.id = r.owner WHERE u.banned = 0 AND r.owner != ? ORDER BY r.t DESC LIMIT 200`).bind(a.uid, a.uid, a.uid, a.uid, a.uid).all()).results || [];
    const out = [];
    for (const r of rows) { this.prPriv.set(r.id, !!r.priv); const n = this.prCount(r.id); if (!r.fr && !r.inv && r.priv && !n) continue;   // strangers' private rooms only show while someone's in them
      const li = this.letIn.get(r.id); const can = !r.priv || !!r.inv || (li && (li.get(a.uid) || 0) > Date.now()) || a.staff === "owner" || a.staff === "mod";
      out.push({ ...this.prOut(r), n, friend: !!r.fr, invited: !!r.inv, can: !!can }); }
    out.sort((x, y) => (y.friend - x.friend) || (y.n - x.n));
    const mines = ((await this.env.DB.prepare("SELECT r.*, u.name AS oname, (SELECT COUNT(*) FROM plike l WHERE l.room = r.id) AS likes FROM prooms r JOIN users u ON u.id = r.owner WHERE r.owner = ? ORDER BY r.id").bind(a.uid).all()).results || []).map((x) => ({ ...this.prOut(x), n: this.prCount(x.id) }));
    return { ok: true, mine: mines[0] || null, mines, maxRooms: PR.maxRooms, maxFarms: FARM.max, maxPlots: FARM.maxPlots, crops: CROPS, rooms: out.slice(0, 60), staff: a.staff === "owner" || a.staff === "mod", owner: a.staff === "owner" };
  }
  // search rooms by room name or owner name (private rooms show up too, with a lock, so people can knock)
  async prSearch(a, m) {
    await this.prTables(); await this.frTable();
    const q = String(m.q || "").replace(/[^A-Za-z0-9 '!?&.,:_-]/g, "").trim().slice(0, 24); if (q.length < 2) return { ok: true, rooms: [] };
    const like = "%" + q.replace(/[%_]/g, "") + "%";
    const rows = (await this.env.DB.prepare(`SELECT r.*, u.name AS oname,
        EXISTS(SELECT 1 FROM friends f WHERE f.st = 'ok' AND ((f.a = ? AND f.b = r.owner) OR (f.b = ? AND f.a = r.owner))) AS fr,
        EXISTS(SELECT 1 FROM pinv i WHERE i.room = r.id AND i.uid = ?) AS inv,
        (SELECT COUNT(*) FROM plike l WHERE l.room = r.id) AS likes, EXISTS(SELECT 1 FROM plike l WHERE l.room = r.id AND l.uid = ?) AS liked
      FROM prooms r JOIN users u ON u.id = r.owner WHERE u.banned = 0 AND (r.name LIKE ? OR u.name LIKE ?) ORDER BY r.t DESC LIMIT 30`).bind(a.uid, a.uid, a.uid, a.uid, like, like).all()).results || [];
    const out = rows.map((r) => { this.prPriv.set(r.id, !!r.priv); const li = this.letIn.get(r.id);
      const can = r.owner === a.uid || !r.priv || !!r.inv || (li && (li.get(a.uid) || 0) > Date.now()) || a.staff === "owner" || a.staff === "mod";
      return { ...this.prOut(r), n: this.prCount(r.id), friend: !!r.fr, invited: !!r.inv, can: !!can, mine: r.owner === a.uid }; });
    return { ok: true, rooms: out };
  }
  async prCreate(a, m) {
    await this.prTables();
    const farm = m.kind === "farm", plot = m.kind === "plot";
    if (farm) { const f = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM prooms WHERE owner = ? AND kind = 'farm'").bind(a.uid).first(); if (f && f.n >= FARM.max) return { ok: false, msg: "You already have a farm. Each llama gets one." }; }
    else { const have = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM prooms WHERE owner = ? AND kind != 'farm'").bind(a.uid).first(); if (have && have.n >= PR.maxRooms) return { ok: false, msg: `You can have up to ${PR.maxRooms} rooms for now.` }; }
    const name = farm ? (a.name + " ACRES").slice(0, PR.nameMax) : (cleanRoomName(m.name) || (a.name + (plot ? "'S PLOT" : "'S ROOM")).slice(0, PR.nameMax));   // farms are always named after their farmer: NAME ACRES
    if (!WF.nameOk(name)) return { ok: false, msg: "That room name isn't allowed. Try another." };
    const ins = await this.env.DB.prepare("INSERT INTO prooms (owner, name, priv, wall, floor, t, kind) VALUES (?, ?, 0, ?, ?, ?, ?)").bind(a.uid, name, "lavender", farm || plot ? "meadow" : "wood", Date.now(), farm ? "farm" : plot ? "plot" : "room").run();
    return { ...(await this.prList(a)), created: ins.meta.last_row_id };
  }
  async prMine(a, m) { await this.prTables(); const want = Math.floor(+((m && (m.rid || m.room)) || 0)) || prId(a.pres && a.pres.rm) || 0;
    let r = want ? await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.owner = ? AND r.id = ?").bind(a.uid, want).first() : null;
    if (!r && !(m && (m.rid || m.room))) r = await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.owner = ? ORDER BY r.id").bind(a.uid).first(); if (r) this.prPriv.set(r.id, !!r.priv); return r; }
  async prInfo(a, m) { const r = await this.prMine(a, m); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const inv = ((await this.env.DB.prepare("SELECT u.name FROM pinv i JOIN users u ON u.id = i.uid WHERE i.room = ? ORDER BY u.name").bind(r.id).all()).results || []).map((x) => x.name.toUpperCase());
    const cnt = await this.env.DB.prepare("SELECT (SELECT COUNT(*) FROM pfurn WHERE room = ?) AS f, (SELECT COUNT(*) FROM pplot WHERE room = ?) AS c").bind(r.id, r.id).first();
    return { ok: true, room: this.prOut(r), invites: inv, furnN: cnt ? cnt.f : 0, crops: cnt ? cnt.c : 0 }; }
  // DELETE a room or farm: owner only, and only with the typed-out confirm the game sends. Placed furniture simply stops being "placed",
  // so it's back in the owner's bag; a paid wallpaper or floor that was up goes back in the bag too. Crops growing on a farm are lost.
  async prDelete(a, m) {
    await this.prTables(); const want = Math.floor(+m.rid || 0); if (!want || m.confirm !== "DELETE") return { ok: false, msg: "Confirm first." };
    const r = await this.prMine(a, { rid: want }); if (!r || r.id !== want) return { ok: false, msg: "That's not your room." };
    const n = ((await this.env.DB.prepare("SELECT COUNT(*) AS n FROM pfurn WHERE room = ?").bind(r.id).first()) || {}).n || 0;
    const db = this.env.DB, st = [];
    for (const [kind, key, T] of [["w", r.wall, DECO_WALL], ["f", r.floor, DECO_FLOOR]]) if (T[key]) st.push(db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, decoItem(kind, key)));
    await this.tileTable(); { const laid = {}; for (const kk of Object.values(await this.roomTiles(r.id))) laid[kk] = (laid[kk] || 0) + 1;   // laid floor squares go back in the bag
      for (const [kk, n2] of Object.entries(laid)) st.push(db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, ?) ON CONFLICT(uid, item) DO UPDATE SET n = n + excluded.n").bind(a.uid, "ft_" + kk, n2)); st.push(db.prepare("DELETE FROM ptile WHERE room = ?").bind(r.id)); }
    st.push(db.prepare("DELETE FROM pplot WHERE room = ?").bind(r.id), db.prepare("DELETE FROM pfurn WHERE room = ?").bind(r.id), db.prepare("DELETE FROM pinv WHERE room = ?").bind(r.id),
      db.prepare("DELETE FROM plike WHERE room = ?").bind(r.id), db.prepare("DELETE FROM prooms WHERE id = ? AND owner = ?").bind(r.id, a.uid));
    await db.batch(st);
    this.letIn.delete(r.id); if (this.prPriv) this.prPriv.delete(r.id);
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.pres.rm !== "p:" + r.id) continue; x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `${r.name} was deleted, so you headed back to the lounge.` }); }
    return { ...(await this.prList(a)), deleted: r.id, msg: `${r.name} is deleted.${n ? ` ${n} ${n === 1 ? "piece" : "pieces"} went back to your bag.` : ""}` };
  }
  async prSet(a, m) {
    const r = await this.prMine(a, m); if (!r) return { ok: false, msg: "You don't have a room yet." };
    if (m.name !== undefined && r.kind === "farm") return { ok: false, msg: "Farms are always named after you." };
    const name = m.name !== undefined ? cleanRoomName(m.name) : r.name; if (!name) return { ok: false, msg: "Give your room a name." };
    if (m.name !== undefined && !WF.nameOk(name)) return { ok: false, msg: "That room name isn't allowed. Try another." };
    const priv = m.priv !== undefined ? (m.priv ? 1 : 0) : r.priv, wall = PR_WALLS.includes(m.wall) ? m.wall : r.wall, floor = PR_FLOORS.includes(m.floor) ? m.floor : r.floor;
    // a wallpaper or floor you haven't bought can't be put up (free ones, and whatever the room already has, are fine)
    // putting up a wallpaper or floor uses one from your bag; the one coming down goes back into your bag. One batch, so it's all or nothing.
    const db = this.env.DB, st = [];
    for (const [kind, now, was, T] of [["w", wall, r.wall, DECO_WALL], ["f", floor, r.floor, DECO_FLOOR]]) { if (now === was) continue;
      if (T[now]) { const have = await db.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, decoItem(kind, now)).first(); if (!have || have.n < 1) return { ok: false, msg: kind === "w" ? "Buy that wallpaper in the SHOP first." : "Buy that floor in the SHOP first." };
        st.push(db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN COALESCE((SELECT n FROM finv WHERE uid = ? AND item = ?), 0) >= 1 THEN 1 ELSE 0 END").bind(a.uid, decoItem(kind, now)),
          db.prepare("UPDATE finv SET n = n - 1 WHERE uid = ? AND item = ?").bind(a.uid, decoItem(kind, now))); }
      if (T[was]) st.push(db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, decoItem(kind, was))); }
    if (st.length) await this.rareTables();   // makes sure trade_guard exists
    st.push(db.prepare("UPDATE prooms SET name = ?, priv = ?, wall = ?, floor = ? WHERE id = ? AND wall = ? AND floor = ?").bind(name, priv, wall, floor, r.id, r.wall, r.floor));
    if (st.length > 1) st.push(db.prepare("DELETE FROM finv WHERE uid = ? AND n <= 0").bind(a.uid), db.prepare("DELETE FROM trade_guard"));
    try { await db.batch(st); } catch (e) { return { ok: false, msg: "That didn't work. Try again." }; }
    const nr = await this.prRoom(r.id); this.toRoom("p:" + r.id, { t: "prr", room: this.prOut(nr) });
    if (priv) await this.prKickUnwelcome(nr);
    return { ok: true, room: this.prOut(nr), deco: await this.decoOwned(a.uid) };
  }
  async prKickUnwelcome(r) {   // a room just went private: anyone inside who isn't allowed goes back to the lounge
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.pres.rm !== "p:" + r.id) continue;
      if (!(await this.prCanEnter(x, r))) { x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `${r.name} is private now, so you headed back to the lounge.` }); } } }
  async prEnter(ws, a, m) {
    const id = Math.floor(+m.rid || 0); const r = id > 0 ? await this.prRoom(id) : null; if (!r) return { ok: false, msg: "That room doesn't exist anymore." };
    const owner = await this.user(r.owner); if (!owner || owner.banned) return { ok: false, msg: "That room is closed." };
    if (r.owner !== a.uid && !a.staff && await this.blockedBy(r.owner, a.uid)) return { ok: false, msg: `You can't go into ${r.name}.` };
    if (!(await this.prCanEnter(a, r))) {
      if (m.pw && r.pwh) { const ok = await this.prTryPassword(a, r, m.pw); if (ok === "wait") return { ok: false, locked: true, pw: true, msg: "Too many wrong tries. Wait 10 minutes." }; if (!ok) return { ok: false, locked: true, pw: true, msg: "Wrong password." }; }
      else return { ok: false, locked: true, pw: !!r.pwh, msg: r.pwh ? `${r.name} is private. Enter the password, or knock and the owner can let you in.` : `${r.name} is private. Knock and the owner can let you in.` };
    }
    a.proom = r.id; ws.serializeAttachment(a);
    return { ok: true, room: { ...this.prOut(r), ...(await this.prLikes(r.id, a.uid)) }, mine: r.owner === a.uid, furn: await this.prFurn(r.id), tiles: await this.roomTiles(r.id) };
  }
  async prKnock(a, m, now) {
    const r = await this.prRoom(Math.floor(+m.rid || 0)); if (!r) return { ok: false, msg: "That room doesn't exist anymore." };
    if (r.owner !== a.uid && !a.staff && await this.blockedBy(r.owner, a.uid)) return { ok: false, msg: `You can't go into ${r.name}.` };
    if (await this.prCanEnter(a, r)) return { ok: true, open: true };
    const k = r.id + ":" + a.uid; if (now - (this.knocks.get(k) || 0) < PR.knockGap) return { ok: false, msg: "You just knocked. Give them a moment." };
    let sent = false; for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === r.owner) { this.send(w, { t: "knock", room: r.id, uid: a.uid, n: a.name }); sent = true; } }
    if (!sent) return { ok: false, msg: `${r.oname.toUpperCase()} isn't online right now, so nobody can answer.` };
    this.knocks.set(k, now); return { ok: true, msg: `You knocked on ${r.name}. Waiting for ${r.oname.toUpperCase()} to answer...` };
  }
  async prAnswer(a, m, now) {
    const r = await this.prMine(a, m); if (!r) return { ok: false };
    const uid = Math.floor(+m.uid || 0); if (!this.knocks.has(r.id + ":" + uid)) return { ok: false, msg: "That knock expired." };
    this.knocks.delete(r.id + ":" + uid);
    if (m.yes) { let li = this.letIn.get(r.id); if (!li) { li = new Map(); this.letIn.set(r.id, li); } li.set(uid, now + PR.letInMs); }
    this.toUid(uid, { t: "knockans", room: r.id, yes: !!m.yes, name: r.name });
    return { ok: true };
  }
  async prInvite(a, m) {
    const r = await this.prMine(a, m); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const n = String(m.n || "").trim(); if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { ok: false, msg: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name FROM users WHERE name = ? AND banned = 0").bind(n).first(); if (!u) return { ok: false, msg: "No llama has that name." };
    if (u.id === a.uid) return { ok: false, msg: "It's your room, you're always invited!" };
    if (m.add && await this.blockedPair(a.uid, u.id)) return { ok: false, msg: `You can't invite ${u.name.toUpperCase()}.` };
    if (m.add) { const c = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM pinv WHERE room = ?").bind(r.id).first(); if (c.n >= 100) return { ok: false, msg: "Your invite list is full." };
      await this.env.DB.prepare("INSERT OR IGNORE INTO pinv (room, uid) VALUES (?, ?)").bind(r.id, u.id).run(); this.toUid(u.id, { t: "prinvited", room: r.id, name: r.name, by: a.name }); }
    else { await this.env.DB.prepare("DELETE FROM pinv WHERE room = ? AND uid = ?").bind(r.id, u.id).run(); const li = this.letIn.get(r.id); if (li) li.delete(u.id); if (r.priv) await this.prKickUnwelcome(r); }
    return this.prInfo(a, { rid: r.id });
  }
  async prKick(a, m) {
    const r = await this.prMine(a, m); if (!r) return { ok: false };
    const n = String(m.n || "").toUpperCase(); let done = false;
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.pres.rm !== "p:" + r.id || x.uid === a.uid || x.name !== n) continue;
      x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `${a.name} asked you to leave ${r.name}.` }); done = true;
      const li = this.letIn.get(r.id); if (li) li.delete(x.uid); }
    return { ok: done, msg: done ? `${n} left your room.` : `${n} isn't in your room.` };
  }
  async furnStorage(uid) {
    await this.prTables();
    const own = (await this.env.DB.prepare("SELECT item, n FROM finv WHERE uid = ?").bind(uid).all()).results || [];
    const placed = new Map(((await this.env.DB.prepare("SELECT p.item, COUNT(*) AS n FROM pfurn p JOIN prooms r ON r.id = p.room WHERE r.owner = ? GROUP BY p.item").bind(uid).all()).results || []).map((x) => [x.item, x.n]));   // across all their rooms
    return own.filter((r) => FURN_ITEMS[r.item] || DECO_ITEMS[r.item]).map((r) => ({ item: r.item, n: r.n, placed: placed.get(r.item) || 0 }));
  }
  // "w:<id>" / "f:<id>" for every wallpaper and floor in the bag (the settings swatches unlock from this)
  async decoOwned(uid) { await this.prTables(); return ((await this.env.DB.prepare("SELECT item FROM finv WHERE uid = ? AND n > 0 AND substr(item, 1, 3) IN ('wp_', 'fl_')").bind(uid).all()).results || []).filter((r) => DECO_ITEMS[r.item]).map((r) => (r.item.startsWith("wp_") ? "w:" : "f:") + r.item.slice(3)); }
  // ---------- floor squares ----------
  async tileTable() { if (this.tileReady) return; await this.prTables(); await this.rareTables();
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS ptile (room INTEGER NOT NULL, gx INTEGER NOT NULL, gy INTEGER NOT NULL, k TEXT NOT NULL, PRIMARY KEY (room, gx, gy))").run(); this.tileReady = true; }
  async tileStock(uid) { await this.tileTable(); const o = {}; for (const r of ((await this.env.DB.prepare("SELECT item, n FROM finv WHERE uid = ? AND n > 0 AND substr(item, 1, 3) = 'ft_'").bind(uid).all()).results || [])) { const k = r.item.slice(3); if (Object.hasOwn(TILES, k)) o[k] = r.n; } return o; }
  async roomTiles(rid) { await this.tileTable(); const o = {}; for (const r of ((await this.env.DB.prepare("SELECT gx, gy, k FROM ptile WHERE room = ?").bind(rid).all()).results || [])) if (Object.hasOwn(TILES, r.k)) o[r.gx + "," + r.gy] = r.k; return o; }
  async tileBuy(a, m) { await this.tileTable(); const k = String(m.k || ""), n = Math.floor(+m.n || 0);
    if (!Object.hasOwn(TILES, k)) return { ok: false, msg: "The shop doesn't sell that floor." }; if (!(n >= 1 && n <= TILE_MAX_BUY)) return { ok: false, msg: `Buy 1 to ${TILE_MAX_BUY} squares at a time.` };
    const cost = TILES[k] * n, tk = await this.debit(a.uid, cost, "floor squares " + k); if (tk === null) return { ok: false, msg: `That costs ${cost} TOKENS.` };
    await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, ?) ON CONFLICT(uid, item) DO UPDATE SET n = n + excluded.n").bind(a.uid, "ft_" + k, n).run();
    return { ok: true, tk, bought: n, k, stock: await this.tileStock(a.uid) }; }
  // lay squares of one kind on the cells given (k = "" lifts whatever is there). Squares that get covered or lifted go back in your bag.
  async tilePut(a, m) { await this.tileTable(); const r = await this.prMine(a, { rid: m.rid }); if (!r) return { ok: false, msg: "You can only floor your own room." };
    const k = m.k ? String(m.k) : ""; if (k && !Object.hasOwn(TILES, k)) return { ok: false, msg: "That isn't a floor." };
    if (k && TILE_GRASS.has(k) !== prOpen(r)) return { ok: false, msg: prOpen(r) ? "Floors are for indoor rooms. Out here you lay GRASS." : "Grass is for outdoor plots and farms. In a room you lay FLOOR squares." };
    const D = prDim(r), seen = new Set(), cells = [];
    for (const c of Array.isArray(m.cells) ? m.cells.slice(0, TILE_MAX_PUT) : []) { const x = Math.floor(+(c && c[0])), y = Math.floor(+(c && c[1])); if (!(x >= 0 && y >= 0 && x < D.w && y < D.h) || seen.has(x + "," + y)) continue; seen.add(x + "," + y); cells.push([x, y]); }
    const cur = await this.roomTiles(r.id), change = cells.filter(([x, y]) => (cur[x + "," + y] || "") !== k), stock = await this.tileStock(a.uid);
    if (!change.length) return { ok: true, tiles: cur, stock };
    if (k && (stock[k] || 0) < change.length) return { ok: false, tiles: cur, stock, msg: `You need ${change.length} ${TILE_NAMES[k]} square${change.length > 1 ? "s" : ""} and have ${stock[k] || 0}. Buy more in the SHOP under WALLS & FLOORS.` };
    const db = this.env.DB, st = [], back = {};
    for (const [x, y] of change) { const was = cur[x + "," + y]; if (was) back[was] = (back[was] || 0) + 1; }
    if (k) st.push(db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN COALESCE((SELECT n FROM finv WHERE uid = ? AND item = ?), 0) >= ? THEN 1 ELSE 0 END").bind(a.uid, "ft_" + k, change.length),
      db.prepare("UPDATE finv SET n = n - ? WHERE uid = ? AND item = ?").bind(change.length, a.uid, "ft_" + k));
    for (const [was, n] of Object.entries(back)) st.push(db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, ?) ON CONFLICT(uid, item) DO UPDATE SET n = n + excluded.n").bind(a.uid, "ft_" + was, n));
    for (let i = 0; i < change.length; i += 20) { const part = change.slice(i, i + 20);
      if (k) st.push(db.prepare("INSERT OR REPLACE INTO ptile (room, gx, gy, k) VALUES " + part.map(() => "(?, ?, ?, ?)").join(", ")).bind(...part.flatMap(([x, y]) => [r.id, x, y, k])));
      else st.push(db.prepare("DELETE FROM ptile WHERE room = ? AND (gx * 1000 + gy) IN (" + part.map(() => "?").join(", ") + ")").bind(r.id, ...part.map(([x, y]) => x * 1000 + y))); }
    st.push(db.prepare("DELETE FROM finv WHERE uid = ? AND n <= 0").bind(a.uid), db.prepare("DELETE FROM trade_guard"));
    try { await db.batch(st); } catch (e) { return { ok: false, msg: "That didn't work. Try again.", tiles: cur, stock }; }
    const tiles = await this.roomTiles(r.id); this.toRoom("p:" + r.id, { t: "prt", room: r.id, tiles });
    return { ok: true, tiles, stock: await this.tileStock(a.uid) }; }
  async decoBuy(a, m) {   // k is "w:<wallpaper>" or "f:<floor>"
    await this.prTables();
    const k = String(m.k || ""), [kind, id] = k.split(":"), table = kind === "w" ? DECO_WALL : kind === "f" ? DECO_FLOOR : null;
    const price = table && Object.hasOwn(table, id) ? table[id] : 0; if (!price) return { ok: false, msg: "The store doesn't sell that." };
    const item = decoItem(kind, id), have = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, item).first();
    if (have && have.n >= 20) return { ok: false, msg: "You have plenty of those." };
    const tk = await this.debit(a.uid, price, "deco " + k); if (tk === null) return { ok: false, msg: `That costs ${price} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, item).run();
    return { ok: true, tk, deco: await this.decoOwned(a.uid), furn: await this.furnStorage(a.uid) };
  }
  // ---- MARKETPLACE: list a piece for tokens; it waits in the market (out of your bag) until someone buys it or you take it back ----
  // Every step is one database batch with guards, so an item or token can never be spent twice. The market keeps MARKET.fee of each sale.
  async mktTable() { if (this.mktReady) return; await this.rareTables();
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS market (id INTEGER PRIMARY KEY AUTOINCREMENT, seller INTEGER NOT NULL, item TEXT NOT NULL, rare INTEGER, price INTEGER NOT NULL, t INTEGER NOT NULL)").run();
    await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS market_seller ON market (seller)").run(); this.mktReady = true; }
  async mktList(a) {
    await this.mktTable();
    const rows = (await this.env.DB.prepare("SELECT m.id, m.item, m.price, m.t, m.seller, u.name, r.serial FROM market m JOIN users u ON u.id = m.seller LEFT JOIN rares r ON r.id = m.rare ORDER BY m.id DESC LIMIT 300").all()).results || [];
    return { ok: true, fee: MARKET.fee, max: MARKET.max, list: rows.map((r) => ({ id: r.id, item: r.item, price: r.price, t: r.t, seller: r.name.toUpperCase(), serial: r.serial || null, mine: r.seller === a.uid })) };
  }
  async mktSell(a, m) {
    await this.mktTable(); await this.prTables();
    const price = Math.floor(+m.price || 0); if (!(price >= 1 && price <= MARKET.maxPrice)) return { ok: false, msg: `Pick a price from 1 to ${MARKET.maxPrice} TOKENS.` };
    const n = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM market WHERE seller = ?").bind(a.uid).first(); if (n && n.n >= MARKET.max) return { ok: false, msg: `You can have up to ${MARKET.max} things for sale at once.` };
    const db = this.env.DB, now = Date.now(); let item = String(m.item || ""), rid = null;
    if (m.rare) { const r = await db.prepare("SELECT id, item FROM rares WHERE id = ? AND owner = ?").bind(Math.floor(+m.rare), a.uid).first(); if (!r) return { ok: false, msg: "You don't own that rare." }; item = r.item; rid = r.id; }
    else if (!(Object.hasOwn(FURN_ITEMS, item) || Object.hasOwn(DECO_ITEMS, item)) || Object.hasOwn(RARES, item)) return { ok: false, msg: "You can't sell that here." };
    if (FURN_STAFF.has(item)) return { ok: false, msg: "Staff items can't be sold." };
    const st = [
      db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN COALESCE((SELECT n FROM finv WHERE uid = ? AND item = ?), 0) - (SELECT COUNT(*) FROM pfurn p JOIN prooms r ON r.id = p.room WHERE r.owner = ? AND p.item = ?) >= 1 THEN 1 ELSE 0 END").bind(a.uid, item, a.uid, item),
      db.prepare("UPDATE finv SET n = n - 1 WHERE uid = ? AND item = ?").bind(a.uid, item)];
    if (rid) st.push(db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN (SELECT owner FROM rares WHERE id = ?) = ? THEN 1 ELSE 0 END").bind(rid, a.uid), db.prepare("UPDATE rares SET owner = 0 WHERE id = ?").bind(rid));
    st.push(db.prepare("INSERT INTO market (seller, item, rare, price, t) VALUES (?, ?, ?, ?, ?)").bind(a.uid, item, rid, price, now), db.prepare("DELETE FROM finv WHERE uid = ? AND n <= 0").bind(a.uid), db.prepare("DELETE FROM trade_guard"));
    try { await db.batch(st); } catch (e) { return { ok: false, msg: "Pick that up from your room first (only things in your bag can be sold)." }; }
    return { ...(await this.mktList(a)), furn: await this.furnStorage(a.uid), rares: await this.rareInfo(a.uid), msg: "Listed! You'll get the tokens when it sells." };
  }
  async mktBack(a, m) {   // take your own listing back
    await this.mktTable(); const L = await this.env.DB.prepare("SELECT * FROM market WHERE id = ?").bind(Math.floor(+m.lid || 0)).first();
    if (!L || L.seller !== a.uid) return { ok: false, msg: "That listing is gone." };
    const db = this.env.DB, st = [db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN EXISTS (SELECT 1 FROM market WHERE id = ? AND seller = ?) THEN 1 ELSE 0 END").bind(L.id, a.uid), db.prepare("DELETE FROM market WHERE id = ?").bind(L.id),
      db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, L.item)];
    if (L.rare) st.push(db.prepare("UPDATE rares SET owner = ? WHERE id = ?").bind(a.uid, L.rare));
    st.push(db.prepare("DELETE FROM trade_guard"));
    try { await db.batch(st); } catch (e) { return { ok: false, msg: "That listing just sold!" }; }
    return { ...(await this.mktList(a)), furn: await this.furnStorage(a.uid), rares: await this.rareInfo(a.uid), msg: "Taken off the market. It's back in your bag." };
  }
  async mktBuy(ws, a, m) {
    await this.mktTable(); const L = await this.env.DB.prepare("SELECT * FROM market WHERE id = ?").bind(Math.floor(+m.lid || 0)).first();
    if (!L) return { ok: false, msg: "Someone just bought that one." }; if (L.seller === a.uid) return { ok: false, msg: "That's your own listing." };
    if (Math.floor(+m.price) !== L.price) return { ok: false, msg: "The price changed. Take another look." };
    if (!L.rare) { const h = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, L.item).first(); if (h && h.n >= 20) return { ok: false, msg: "You have plenty of those." }; }
    const db = this.env.DB, now = Date.now(), fee = Math.floor(L.price * MARKET.fee), got = L.price - fee, seller = await this.user(L.seller), sname = seller ? seller.name.toUpperCase() : "?";
    const st = [db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN EXISTS (SELECT 1 FROM market WHERE id = ?) THEN 1 ELSE 0 END").bind(L.id), db.prepare("DELETE FROM market WHERE id = ?").bind(L.id),
      db.prepare("UPDATE users SET tk = tk - ? WHERE id = ?").bind(L.price, a.uid), db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN (SELECT tk FROM users WHERE id = ?) >= 0 THEN 1 ELSE 0 END").bind(a.uid),
      db.prepare("UPDATE users SET tk = tk + ? WHERE id = ?").bind(got, L.seller),
      db.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(a.uid, -L.price, `market buy ${L.item} from ${sname}`, now),
      db.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(L.seller, got, `market sale ${L.item} to ${a.name} (fee ${fee})`, now),
      db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, L.item)];
    if (L.rare) st.push(db.prepare("UPDATE rares SET owner = ? WHERE id = ?").bind(a.uid, L.rare));
    st.push(db.prepare("DELETE FROM trade_guard"), db.prepare("INSERT INTO trades (t, a, b, a_gave, b_gave) VALUES (?, ?, ?, ?, ?)").bind(now, L.seller, a.uid, JSON.stringify({ market: L.id, item: L.item, rare: L.rare }), JSON.stringify({ tk: L.price })));
    try { await db.batch(st); } catch (e) { const gone = !(await db.prepare("SELECT 1 FROM market WHERE id = ?").bind(L.id).first()); return { ok: false, msg: gone ? "Someone just bought that one." : `That costs ${L.price} TOKENS. Play some games to earn more!` }; }
    const me = await this.user(a.uid), [w, x] = this.sockOf(L.seller);
    if (w && seller) { if (x) { x.uc = { ...(x.uc || {}), t: Date.now(), tk: seller.tk + got }; w.serializeAttachment(x); } this.send(w, { t: "mkt_sold", item: L.item, price: L.price, got, to: a.name, tk: seller.tk + got }); }
    return { ...(await this.mktList(a)), tk: me.tk, furn: await this.furnStorage(a.uid), rares: await this.rareInfo(a.uid), msg: "Bought! It's in your bag." };
  }
  async kitBuy(a, m) {
    await this.prTables();
    const k = String(m.kit || ""); if (!Object.hasOwn(KITS, k)) return { ok: false, msg: "That kit isn't for sale." };
    const items = Object.entries(KITS[k].items), have = new Map(((await this.env.DB.prepare("SELECT item, n FROM finv WHERE uid = ?").bind(a.uid).all()).results || []).map((r) => [r.item, r.n]));
    if (items.some(([it, n]) => (have.get(it) || 0) + n > 20)) return { ok: false, msg: "You have plenty of some of these already." };
    const price = kitPrice(k), tk = await this.debit(a.uid, price, "kit " + k); if (tk === null) return { ok: false, msg: `That kit costs ${price} TOKENS. Play some games to earn more!` };
    await this.env.DB.batch(items.map(([it, n]) => this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, ?) ON CONFLICT(uid, item) DO UPDATE SET n = n + ?").bind(a.uid, it, n, n)));
    return { ok: true, tk, furn: await this.furnStorage(a.uid), msg: `You bought the ${KITS[k].n} kit!` };
  }
  async furnBuy(a, m) {
    await this.prTables();
    const k = String(m.item || ""); const price = Object.hasOwn(FURN_ITEMS, k) && FURN_SALE.has(k) ? FURN_ITEMS[k] : 0; if (!price) return { ok: false, msg: "The store doesn't sell that." };
    if (FURN_STAFF.has(k) && !(await this.staffNow(a))) return { ok: false, msg: "Only staff can buy that." };
    const have = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, k).first(); if (have && have.n >= 20) return { ok: false, msg: "You have plenty of those." };
    const tk = await this.debit(a.uid, price, "furniture " + k); if (tk === null) return { ok: false, msg: `That costs ${price} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, k).run();
    return { ok: true, tk, furn: await this.furnStorage(a.uid) };
  }
  async prOwnRoomHere(a) {   // editing: only the owner, standing in their own room
    const id = prId(a.pres && a.pres.rm); if (!id) return null; const r = await this.prMine(a, { rid: id }); return r && r.id === id ? r : null; }
  // tiles a piece covers: the bed is two long (along x for rot 0/2, along y for rot 1/3); everything else is one tile
  furnTiles(item, gx, gy, rot) { if (FURN_DIM[item]) { let [W, D] = FURN_DIM[item]; if (rot % 2) [W, D] = [D, W]; const out = []; for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) out.push([gx + i, gy + j]); return out; }
    const bi = furnBase(item), n = FURN_SIZE[bi] || 1, alongY = FURN_SIDEWAYS.has(bi) ? (rot === 0 || rot === 3) : rot % 2 === 1, out = []; for (let k = 0; k < n; k++) out.push(alongY ? [gx, gy + k] : [gx + k, gy]); return out; }
  furnFits(item, gx, gy, rot, furn, skipId, D = PR) {   // null if it fits, otherwise the reason (D: the room's size)
    const layer = layerOf(item), wall = layer === "wall", tiles = this.furnTiles(item, gx, gy, rot);
    for (const [x, y] of tiles) {
      if (!(x >= 0 && y >= 0 && x < D.w && y < D.h)) return "That doesn't fit there.";
      if (layer === "floor" && D.clear.includes(x + "," + y)) return D === FARM ? "Keep the gate clear." : "Keep the doorway clear.";
    }
    for (const f of furn) {
      if (f.id === skipId || layerOf(f.item) !== layer) continue;   // rugs only bump into rugs, wall items into wall items
      const ft = this.furnTiles(f.item, f.gx, f.gy, f.rot);
      if (ft.some(([x, y]) => tiles.some(([u, v]) => u === x && v === y))) return wall ? "Something is already there." : "Something is in the way.";
    }
    return null;
  }
  async prPlace(a, m) {
    const r = await this.prOwnRoomHere(a); if (!r) return { ok: false, msg: "Go into your own room to place furniture." };
    const k = String(m.item || ""); if (!Object.hasOwn(FURN_ITEMS, k)) return { ok: false, msg: "That's not furniture." };
    const gx = Math.floor(+m.gx), gy = Math.floor(+m.gy), rot = ((Math.floor(+m.rot) || 0) % 4 + 4) % 4;
    const DM = prDim(r); if (!(gx >= 0 && gy >= 0 && gx < DM.w && gy < DM.h)) return { ok: false, msg: "That's outside the room." };
    const wall = FURN_WALL.has(k); if (wall && prOpen(r)) return { ok: false, msg: "There are no walls out here, so wall pieces can't go here." };
    if (wall && gx !== 0 && gy !== 0) return { ok: false, msg: "Wall items go on a wall. Tap a spot right next to a wall." };
    if (wall && gx === 0 && gy >= PR.h - 2) return { ok: false, msg: "That's where the door is." };
    const furn = await this.prFurn(r.id); if (furn.length >= PR.maxFurn) return { ok: false, msg: `Rooms hold up to ${PR.maxFurn} pieces.` };
    if (FARM_ONLY.has(k) && r.kind !== "farm") return { ok: false, msg: "Garden plots only go in a FARM. Make one in ROOMS > PLAYER ROOMS." };
    if (k === "plot" && furn.filter((f) => f.item === "plot").length >= FARM.maxPlots) return { ok: false, msg: `A farm holds up to ${FARM.maxPlots} garden plots.` };
    { const why = this.furnFits(k, gx, gy, rot, furn, -1, DM); if (why) return { ok: false, msg: why }; }
    const own = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, k).first();
    if (!own || furn.filter((f) => f.item === k).length >= own.n) return { ok: false, msg: "You don't have one of those in storage." };
    await this.env.DB.prepare("INSERT INTO pfurn (room, item, gx, gy, rot) VALUES (?, ?, ?, ?, ?)").bind(r.id, k, gx, gy, rot).run();
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  // ---------- FARMING: everything checked here (whose farm, standing next to the plot, money, timers) ----------
  async farmPlot(a, m) {   // the plot you're standing next to, in the room you're in
    await this.prTables(); const rid = prId(a.pres && a.pres.rm); if (!rid || a.proom !== rid) return { err: "Walk into the farm first." };
    const r = await this.prRoom(rid); if (!r || r.kind !== "farm") return { err: "That's not a farm." };
    const f = await this.env.DB.prepare("SELECT f.*, p.crop, p.planted, p.ready, p.wat FROM pfurn f LEFT JOIN pplot p ON p.fid = f.id WHERE f.id = ? AND f.room = ? AND f.item = 'plot'").bind(Math.floor(+m.fid || 0), rid).first();
    if (!f) return { err: "That plot is gone." };
    const x = +a.pres.x, y = +a.pres.y; if (!(Math.abs(x - (f.gx + 0.5)) <= 1.7 && Math.abs(y - (f.gy + 0.5)) <= 1.7)) return { err: "Walk up to the plot first." };
    return { r, f, rid };
  }
  async farmDone(rid) { const nf = await this.prFurn(rid); this.toRoom("p:" + rid, { t: "prf", room: rid, furn: nf }); return nf; }
  async farmAct(ws, a, m, what) {
    const P = await this.farmPlot(a, m); if (P.err) return { ok: false, msg: P.err };
    const { r, f, rid } = P, now = Date.now(), mine = r.owner === a.uid;
    if (what === "plant") {
      if (!mine) return { ok: false, msg: "Only the farmer can plant here." };
      if (f.crop) return { ok: false, msg: "Something's already growing there." };
      const k = String(m.crop || ""); if (!Object.hasOwn(CROPS, k)) return { ok: false, msg: "Pick a crop to plant." };
      const C = CROPS[k], tk = await this.debit(a.uid, C.seed, "seeds " + k); if (tk === null) return { ok: false, msg: `${C.n} seeds cost ${C.seed} TOKENS.` };
      const ins = await this.env.DB.prepare("INSERT OR IGNORE INTO pplot (fid, room, crop, planted, ready, wat) VALUES (?, ?, ?, ?, ?, 0)").bind(f.id, rid, k, now, now + C.ms).run();
      if (!ins.meta.changes) { await this.credit(a.uid, C.seed, "seeds refund"); return { ok: false, msg: "Something's already growing there." }; }
      return { ok: true, tk, furn: await this.farmDone(rid), msg: `Planted ${C.n}! Ready in ${fmtDur(C.ms)}.` };
    }
    if (what === "water") {
      if (mine) return { ok: false, msg: "Your crops need a friend to water them. Visitors can water each planting once." };
      if (!f.crop) return { ok: false, msg: "Nothing is growing there yet." };
      if (now >= f.ready) return { ok: false, msg: "It's ready to harvest already!" };
      if (f.wat) return { ok: false, msg: "Someone already watered this one." };
      if (!a.wtr || now - a.wtr[0] > 3600e3) a.wtr = [now, 0]; if (++a.wtr[1] > 40) { ws.serializeAttachment(a); return { ok: false, msg: "That's a lot of watering! Take a break." }; } ws.serializeAttachment(a);
      const C = CROPS[f.crop], cut = Math.round(C.ms * FARM.waterCut);
      const up = await this.env.DB.prepare("UPDATE pplot SET wat = 1, wby = ?, ready = MAX(?, ready - ?) WHERE fid = ? AND wat = 0").bind(a.name, now, cut, f.id).run();
      if (!up.meta.changes) return { ok: false, msg: "Someone already watered this one." };
      for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === r.owner) this.send(w, { t: "toast", msg: `${a.name} watered your ${C.n.toLowerCase()} at ${r.name}!` }); }
      return { ok: true, furn: await this.farmDone(rid), msg: `You watered the ${C.n.toLowerCase()}. They'll be ready sooner!` };
    }
    if (what === "harvest") {
      if (!mine) return { ok: false, msg: "Only the farmer can harvest." };
      if (!f.crop) return { ok: false, msg: "Nothing is growing there yet." };
      if (now < f.ready) return { ok: false, msg: `Still growing. Ready in ${fmtDur(f.ready - now)}.` };
      const del = await this.env.DB.prepare("DELETE FROM pplot WHERE fid = ? AND ready <= ?").bind(f.id, now).run(); if (!del.meta.changes) return { ok: false, msg: "Already harvested." };
      const C = CROPS[f.crop], tk = await this.credit(a.uid, C.pay, "harvest " + f.crop);
      return { ok: true, tk, pay: C.pay, crop: f.crop, furn: await this.farmDone(rid), msg: `Harvested ${C.n}! +${C.pay} TOKENS` };
    }
    return { ok: false };
  }
  // ---------- ROOM PASSWORDS: an extra way into a private room (besides an invite or a knock). Stored as a salted hash; tries are limited. ----------
  async prPassword(a, m) {
    const r = await this.prMine(a, m); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const pw = String(m.pw || "");
    if (!pw) { await this.env.DB.prepare("UPDATE prooms SET pwh = NULL, pws = NULL WHERE id = ?").bind(r.id).run(); }
    else { if (pw.length < 4 || pw.length > 24) return { ok: false, msg: "Passwords are 4 to 24 characters." };
      const salt = b64u(crypto.getRandomValues(new Uint8Array(12))); await this.env.DB.prepare("UPDATE prooms SET pwh = ?, pws = ?, priv = 1 WHERE id = ?").bind(await sha256hex(salt + ":" + pw), salt, r.id).run(); }
    this.letIn.delete(r.id);   // a new or removed password: people let in by the old one need it again
    const nr = await this.prRoom(r.id); this.toRoom("p:" + r.id, { t: "prr", room: this.prOut(nr) }); if (nr.priv) await this.prKickUnwelcome(nr);
    return { ok: true, room: this.prOut(nr), msg: pw ? "Password set. Your room is private, and people with the password can come in." : "Password removed." };
  }
  async prTryPassword(a, r, pw) {   // true if right; 5 wrong tries per room every 10 minutes
    if (!r.pwh || !pw) return false; const k = r.id + ":" + a.uid, now = Date.now(); this.pwTries = this.pwTries || new Map();
    const t = (this.pwTries.get(k) || []).filter((x) => now - x < 600e3); if (t.length >= 5) return "wait";
    if ((await sha256hex(r.pws + ":" + String(pw).slice(0, 24))) === r.pwh) { this.pwTries.delete(k); let li = this.letIn.get(r.id); if (!li) { li = new Map(); this.letIn.set(r.id, li); } li.set(a.uid, now + PR.letInMs); return true; }
    t.push(now); this.pwTries.set(k, t); return false;
  }
  async prToggle(ws, a, m) {   // switch a TV or lamp on or off: anyone in the room can, a couple of times a second at most
    const rm = a.pres && a.pres.rm, rid = rm && rm.startsWith("p:") ? Math.floor(+rm.slice(2) || 0) : 0;
    if (!rid || a.proom !== rid) return { ok: false, msg: "Walk into the room first." };
    const now = Date.now(); if (!a.tg || now - a.tg[0] > 10000) a.tg = [now, 0]; if (++a.tg[1] > 20) { ws.serializeAttachment(a); return { ok: false, msg: "Easy on the switch!" }; } ws.serializeAttachment(a);
    await this.prTables();
    const f = await this.env.DB.prepare("SELECT id, item FROM pfurn WHERE id = ? AND room = ?").bind(Math.floor(+m.fid || 0), rid).first();
    if (!f || !FURN_SWITCH.has(f.item)) return { ok: false, msg: "That doesn't switch on or off." };
    await this.env.DB.prepare("UPDATE pfurn SET off = 1 - off WHERE id = ?").bind(f.id).run();
    const nf = await this.prFurn(rid); this.toRoom("p:" + rid, { t: "prf", room: rid, furn: nf });
    return { ok: true };
  }
  // who may move or turn pieces in the room they're standing in: the owner, or staff (re-checked from the database every time, and logged)
  async prMoveRoom(a) { const own = await this.prOwnRoomHere(a); if (own) return { r: own, staff: false };
    const rm = a.pres && typeof a.pres.rm === "string" && /^p:\d+$/.test(a.pres.rm) ? +a.pres.rm.slice(2) : 0; if (!rm) return null;
    if (!(await this.staffNow(a))) return null; const r = await this.prRoom(rm); return r ? { r, staff: true } : null; }
  async prMove(a, m) {   // drag a placed piece to another tile (same checks as placing it)
    const E = await this.prMoveRoom(a); if (!E) return { ok: false, msg: "Go into your own room to move furniture." }; const r = E.r;
    const id = Math.floor(+m.fid || 0); const f = await this.env.DB.prepare("SELECT * FROM pfurn WHERE id = ? AND room = ?").bind(id, r.id).first(); if (!f) return { ok: false, msg: "That piece is gone." };
    const gx = Math.floor(+m.gx), gy = Math.floor(+m.gy);
    if (!(gx >= 0 && gy >= 0 && gx < prDim(r).w && gy < prDim(r).h)) return { ok: false, msg: "That's outside the room." };
    if (FURN_WALL.has(f.item)) { if (gx !== 0 && gy !== 0) return { ok: false, msg: "Wall items go on a wall." }; if (gx === 0 && gy >= PR.h - 2) return { ok: false, msg: "That's where the door is." }; }
    const why = this.furnFits(f.item, gx, gy, f.rot, await this.prFurn(r.id), f.id, prDim(r)); if (why) return { ok: false, msg: why };
    await this.env.DB.prepare("UPDATE pfurn SET gx = ?, gy = ? WHERE id = ?").bind(gx, gy, id).run();
    if (E.staff) await this.logStaff(a.name, "movefurn", `${f.item.replace(/_/g, " ").toUpperCase()} in ${r.oname.toUpperCase()}'S ROOM (${f.gx},${f.gy} to ${gx},${gy})`);
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  async prEditPiece(a, m, what) {
    const E = what === "rot" ? await this.prMoveRoom(a) : { r: await this.prOwnRoomHere(a), staff: false }; const r = E && E.r; if (!r) return { ok: false, msg: "Go into your own room to change furniture." };
    const id = Math.floor(+m.fid || 0); const f = await this.env.DB.prepare("SELECT * FROM pfurn WHERE id = ? AND room = ?").bind(id, r.id).first(); if (!f) return { ok: false, msg: "That piece is gone." };
    if (what === "rot") { const why = this.furnFits(f.item, f.gx, f.gy, (f.rot + 1) % 4, await this.prFurn(r.id), f.id, prDim(r)); if (why) return { ok: false, msg: why === "Something is in the way." ? "No room to turn it there." : why }; }
    if (what === "rot") { await this.env.DB.prepare("UPDATE pfurn SET rot = (rot + 1) % 4 WHERE id = ?").bind(id).run(); if (E.staff) await this.logStaff(a.name, "turnfurn", `${f.item.replace(/_/g, " ").toUpperCase()} in ${r.oname.toUpperCase()}'S ROOM`); }
    else { await this.env.DB.prepare("DELETE FROM pfurn WHERE id = ?").bind(id).run(); await this.env.DB.prepare("DELETE FROM pplot WHERE fid = ?").bind(id).run(); }   // picking up a plot loses what's growing in it
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  async prStaff(a, m) {   // staff can reset a room's name (and make it private) if it breaks the rules
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can do that." };
    const r = await this.prRoom(Math.floor(+m.rid || 0)); if (!r) return { ok: false, msg: "No such room." };
    await this.env.DB.prepare("UPDATE prooms SET name = ? WHERE id = ?").bind((r.oname.toUpperCase() + "'S ROOM").slice(0, PR.nameMax), r.id).run();
    await this.logStaff(a.name, "roomreset", r.oname.toUpperCase());
    const nr = await this.prRoom(r.id); this.toRoom("p:" + r.id, { t: "prr", room: this.prOut(nr) }); return { ok: true, msg: "Room name reset." };
  }

  // ---------- wardrobe and inventory ----------
  async invTables() { if (this.invReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS inv (uid INTEGER NOT NULL, item TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (uid, item))").run();
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS wear (uid INTEGER PRIMARY KEY, hat TEXT, eyes TEXT, neck TEXT, shirt TEXT)").run();
    for (const col of ["hands", "legs"]) { try { await this.env.DB.prepare(`ALTER TABLE wear ADD COLUMN ${col} TEXT`).run(); } catch (e) {} }   // added later: gloves and shorts
    this.invReady = true; }
  async wearLoad(uid) { await this.invTables(); const r = await this.env.DB.prepare("SELECT * FROM wear WHERE uid = ?").bind(uid).first(); const w = {};
    if (r) for (const s of WEAR_SLOTS) if (r[s] && ITEMS[r[s]] && ITEMS[r[s]].s === s) w[s] = r[s]; return w; }
  async invInfo(uid) { await this.invTables(); const rows = (await this.env.DB.prepare("SELECT item FROM inv WHERE uid = ? ORDER BY t").bind(uid).all()).results || []; return { owned: rows.map((r) => r.item).filter((k) => ITEMS[k]) }; }
  async invBuy(ws, a, m) {
    await this.invTables();
    const k = String(m.item || ""); const it = Object.hasOwn(ITEMS, k) ? ITEMS[k] : null;
    if (!it) return { ok: false, msg: "The store doesn't sell that." };
    if (!a.pres || a.pres.rm !== "store") return { ok: false, msg: "Visit the LLAMA STORE to buy clothes." };
    const have = await this.env.DB.prepare("SELECT 1 FROM inv WHERE uid = ? AND item = ?").bind(a.uid, k).first();
    if (have) return { ok: false, msg: "You already own that. Find it in your wardrobe." };
    const tk = await this.debit(a.uid, it.p, "wardrobe " + k); if (tk === null) return { ok: false, msg: `That costs ${it.p} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT OR IGNORE INTO inv (uid, item, t) VALUES (?, ?, ?)").bind(a.uid, k, Date.now()).run();
    return { ok: true, tk, ...(await this.invInfo(a.uid)) };
  }
  async invWear(ws, a, m) {
    await this.invTables();
    const slot = String(m.slot || ""); if (!WEAR_SLOTS.includes(slot)) return { ok: false, msg: "Bad slot." };
    let k = m.item == null || m.item === "" ? null : String(m.item);
    if (k) { if (!Object.hasOwn(ITEMS, k) || ITEMS[k].s !== slot) return { ok: false, msg: "That doesn't go there." };
      const have = await this.env.DB.prepare("SELECT 1 FROM inv WHERE uid = ? AND item = ?").bind(a.uid, k).first(); if (!have) return { ok: false, msg: "You don't own that yet." }; }
    await this.env.DB.prepare(`INSERT INTO wear (uid, ${slot}) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET ${slot} = excluded.${slot}`).bind(a.uid, k).run();
    a.wear = { ...(a.wear || {}) }; if (k) a.wear[slot] = k; else delete a.wear[slot];
    if (a.pres){ if (Object.keys(a.wear).length) a.pres.w = a.wear; else delete a.pres.w; this.peersOut(ws, a, "updated"); }
    ws.serializeAttachment(a);
    return { ok: true, w: a.wear };
  }

  // ---------- food and drink: what you hold fills your meters a fifth at a time, one sip or bite at a time ----------
  async holdFood(uid, f) { await this.ctx.storage.put("held:" + uid, { hu: f.hu || 0, th: f.th || 0, left: SIPS, last: 0 }); }
  async sipHeld(ws, a, now) {
    const h = await this.ctx.storage.get("held:" + a.uid);
    if (!h || h.left <= 0) return { ok: true, nd: this.needsOut(a) };
    if (now - h.last < 900) return { ok: true, nd: this.needsOut(a) };   // one sip at a time
    h.left--; h.last = now;
    if (h.left > 0) await this.ctx.storage.put("held:" + a.uid, h); else await this.ctx.storage.delete("held:" + a.uid);
    await this.needsEat(ws, a, { hu: h.hu / SIPS, th: h.th / SIPS }, now);
    return { ok: true, nd: this.needsOut(a) };
  }

  // ---------- limited rares ----------
  async rareTables() { if (this.rareReady) return; await this.prTables();
    for (const q of ["CREATE TABLE IF NOT EXISTS rares (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL, serial INTEGER NOT NULL, owner INTEGER NOT NULL, t INTEGER NOT NULL, UNIQUE (item, serial))",
      "CREATE INDEX IF NOT EXISTS rares_owner ON rares (owner)",
      "CREATE TABLE IF NOT EXISTS trade_guard (ok INTEGER NOT NULL CHECK (ok = 1))",   // a trade step that would break the rules inserts 0 here, which aborts the whole trade
      "CREATE TABLE IF NOT EXISTS trades (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, a INTEGER NOT NULL, b INTEGER NOT NULL, a_gave TEXT NOT NULL, b_gave TEXT NOT NULL)"]) await this.env.DB.prepare(q).run();
    this.rareReady = true; }
  // how many llamas own each piece of furniture and each piece of clothing (cached for a minute)
  async itemStats() {
    const now = Date.now(); if (this.istat && now - this.istat.t < 60000) return this.istat.v;
    await this.prTables(); await this.invTables();
    const f = (await this.env.DB.prepare("SELECT item, COUNT(*) AS n FROM finv WHERE n > 0 GROUP BY item").all()).results || [];
    const w = (await this.env.DB.prepare("SELECT item, COUNT(*) AS n FROM inv GROUP BY item").all()).results || [];
    const v = { furn: Object.fromEntries(f.map((r) => [r.item, r.n])), wear: Object.fromEntries(w.map((r) => [r.item, r.n])) };
    this.istat = { t: now, v }; return v;
  }
  async whoCard(name) {
    if (!/^[A-Za-z0-9_]{3,12}$/.test(name)) return { ok: false, msg: "No llama has that name." };
    const DB = this.env.DB, u = await DB.prepare("SELECT id, name, c, created, role, best_hay, best_dash, banned FROM users WHERE name = ?").bind(name).first();
    if (!u || u.banned) return { ok: false, msg: "No llama has that name." };
    const safe = async (fn, d) => { try { return await fn(); } catch (e) { return d; } };
    const ar = await safe(() => this.arenaRow(u.id), {}), bw = await safe(() => this.bowlRow(u.id), {});
    await this.prTables(); await this.rareTables();
    const r = await DB.prepare("SELECT id, name, priv FROM prooms WHERE owner = ?").bind(u.id).first();
    const room = r ? { id: r.id, name: r.name, priv: !!r.priv, likes: (await this.prLikes(r.id, 0)).likes } : null;
    const rares = ((await DB.prepare("SELECT item, serial FROM rares WHERE owner = ? ORDER BY item, serial").bind(u.id).all()).results || []).map((x) => ({ item: x.item, serial: x.serial }));
    return { ok: true, p: { n: u.name.toUpperCase(), c: u.c || null, since: u.created, st: u.role === "admin" ? "owner" : u.role === "mod" ? "mod" : "",
      hay: u.best_hay || 0, dash: u.best_dash || 0, arena: ar.best || 0, wins: ar.wins || 0, bowl: bw.best || 0, room, rares } };
  }
  async rareInfo(uid) {
    await this.rareTables();
    const sold = new Map(((await this.env.DB.prepare("SELECT item, COUNT(*) AS n FROM rares GROUP BY item").all()).results || []).map((r) => [r.item, r.n]));
    const mine = (await this.env.DB.prepare("SELECT id, item, serial FROM rares WHERE owner = ? ORDER BY item, serial").bind(uid).all()).results || [];
    return { list: Object.entries(RARES).map(([k, R]) => ({ k, n: R.n, p: R.p, max: R.max, sold: sold.get(k) || 0, open: R.open, each: RARE_EACH })), mine, now: Date.now() };
  }
  async rareBuy(a, m) {
    await this.rareTables();
    const k = String(m.item || ""), R = Object.hasOwn(RARES, k) ? RARES[k] : null; if (!R) return { ok: false, msg: "That isn't a fair prize." };
    if (!a.pres || a.pres.rm !== "store") return { ok: false, msg: "Visit the LLAMA STORE to get a fair prize." };
    const now = Date.now(); if (now < R.open) return { ok: false, msg: `The ${R.n} hasn't arrived from the fair yet.` };
    const bought = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM ledger WHERE uid = ? AND reason = ?").bind(a.uid, "rare " + k).first();
    if (bought.n >= RARE_EACH) return { ok: false, msg: `You can take home ${RARE_EACH} of each fair prize. Trade for more!` };
    const left = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM rares WHERE item = ?").bind(k).first(); if (left.n >= R.max) return { ok: false, msg: "ALL GONE! The only way to get one now is to trade for it." };
    const tk = await this.debit(a.uid, R.p, "rare " + k); if (tk === null) return { ok: false, msg: `That costs ${R.p} TOKENS. Play some games to earn more!` };
    // take the next number, but never past the limit (UNIQUE item+serial stops two buyers getting the same number)
    let r = null; try { r = await this.env.DB.prepare("INSERT INTO rares (item, serial, owner, t) SELECT ?, COUNT(*) + 1, ?, ? FROM rares WHERE item = ? HAVING COUNT(*) < ? RETURNING id, serial").bind(k, a.uid, now, k, R.max).first(); } catch (e) { r = null; }
    if (!r) { const tk2 = await this.credit(a.uid, R.p, "rare refund " + k); return { ok: false, tk: tk2, msg: "Someone grabbed the last one first! Your tokens are back." }; }
    await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, k).run();
    return { ok: true, tk, serial: r.serial, msg: `The ${R.n} is yours!`, rares: await this.rareInfo(a.uid), furn: await this.furnStorage(a.uid) };
  }

  // ---------- trading ----------
  sockOf(uid) { for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === uid && x.pres) return [w, x]; } return [null, null]; }
  tradeOut(T, i) { const S = T.side[i], O = T.side[1 - i]; return { t: "trade", tid: T.id, open: T.open, them: O.name, mine: S.offer, theirs: O.offer, ok: [S.ok, O.ok] }; }
  tradePush(T) { for (let i = 0; i < 2; i++) { const [w] = this.sockOf(T.side[i].uid); if (w) this.send(w, this.tradeOut(T, i)); } }
  tradeEnd(T, msg) { if (!this.trades) return; this.trades.delete(T.id); for (const S of T.side) { if (this.tradeOf.get(S.uid) === T.id) this.tradeOf.delete(S.uid); const [w] = this.sockOf(S.uid); if (w) this.send(w, { t: "tradeend", tid: T.id, msg }); } }
  tradeDrop(uid, why) { if (!this.tradeOf) return; const id = this.tradeOf.get(uid); const T = id && this.trades.get(id); if (T) this.tradeEnd(T, why); }
  async tradeReq(ws, a, m) {
    await this.rareTables(); this.trades = this.trades || new Map(); this.tradeOf = this.tradeOf || new Map();
    const n = String(m.n || "").trim().toUpperCase(); if (!/^[A-Z0-9_]{3,12}$/.test(n) || n === a.name) return { ok: false, msg: "Pick someone else to trade with." };
    let them = null, tw = null; for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.name === n) { them = x; tw = w; } }
    if (!them || !a.pres || them.pres.rm !== a.pres.rm) return { ok: false, msg: `${n} has to be in the same room as you to trade.` };
    const now = Date.now(); if (now - (a.tq || 0) < 5000) return { ok: false, msg: "Wait a moment before asking again." }; a.tq = now; ws.serializeAttachment(a);
    if (this.tradeOf.has(a.uid)) this.tradeDrop(a.uid, "The trade was cancelled.");
    if (await this.blockedPair(a.uid, them.uid)) return { ok: false, msg: `You can't trade with ${n}.` };
    if (this.tradeOf.has(them.uid)) return { ok: false, msg: `${n} is already trading with someone.` };
    const T = { id: crypto.randomUUID().slice(0, 12), open: false, t: now, side: [{ uid: a.uid, name: a.name, offer: { items: {}, rares: [], tk: 0 }, ok: false }, { uid: them.uid, name: them.name, offer: { items: {}, rares: [], tk: 0 }, ok: false }] };
    this.trades.set(T.id, T); this.tradeOf.set(a.uid, T.id); this.tradeOf.set(them.uid, T.id);
    this.send(tw, { t: "tradereq", tid: T.id, from: a.name });
    return { ok: true, tid: T.id, msg: `Asked ${n} to trade. Waiting for them to accept...` };
  }
  tradeGet(a, m) { const T = this.trades && this.trades.get(String(m.tid || "")); if (!T) return [null, -1]; const i = T.side.findIndex((s) => s.uid === a.uid); return i < 0 ? [null, -1] : [T, i]; }
  async tradeAnswer(a, m) {
    const [T, i] = this.tradeGet(a, m); if (!T || i !== 1 || T.open) return { ok: false, msg: "That trade request expired." };
    if (Date.now() - T.t > TRADE.ask) { this.tradeEnd(T, "The trade request expired."); return { ok: false, msg: "That trade request expired." }; }
    if (!m.yes) { this.tradeEnd(T, `${a.name} said no to trading.`); return { ok: true }; }
    T.open = true; this.tradePush(T); return { ok: true };
  }
  // what a llama can give right now: storage minus what's placed in their room, their numbered rares, their tokens
  async tradeHave(uid) {
    await this.rareTables();
    const rows = (await this.env.DB.prepare("SELECT f.item, f.n, (SELECT COUNT(*) FROM pfurn p JOIN prooms r ON r.id = p.room WHERE r.owner = f.uid AND p.item = f.item) AS placed FROM finv f WHERE f.uid = ?").bind(uid).all()).results || [];
    const free = new Map(rows.map((r) => [r.item, Math.max(0, r.n - r.placed)]));
    const rares = (await this.env.DB.prepare("SELECT id, item, serial FROM rares WHERE owner = ?").bind(uid).all()).results || [];
    const u = await this.user(uid); return { free, rares, tk: u ? u.tk : 0 };
  }
  async tradeSet(a, m) {
    const [T, i] = this.tradeGet(a, m); if (!T || !T.open) return { ok: false, msg: "That trade is over." };
    const H = await this.tradeHave(a.uid), items = {}, rares = [];
    const inItems = m.items && typeof m.items === "object" ? m.items : {};
    for (const [k, v] of Object.entries(inItems)) { const n = Math.floor(+v || 0); if (n <= 0) continue;
      if (!(Object.hasOwn(FURN_ITEMS, k) || Object.hasOwn(DECO_ITEMS, k)) || Object.hasOwn(RARES, k)) return { ok: false, msg: "You can't trade that." };   // rares go by their number
      if (n > TRADE.maxEach || n > (H.free.get(k) || 0)) return { ok: false, msg: "You don't have that many in storage (placed pieces stay put)." };
      items[k] = n; }
    const need = new Map();
    for (const rid of (Array.isArray(m.rares) ? m.rares : []).slice(0, TRADE.maxLines)) { const R = H.rares.find((r) => r.id === Math.floor(+rid)); if (!R) return { ok: false, msg: "You don't own that rare." };
      if (!rares.some((x) => x.id === R.id)) { rares.push(R); need.set(R.item, (need.get(R.item) || 0) + 1); } }
    for (const [k, n] of need) if (n > (H.free.get(k) || 0)) return { ok: false, msg: "Pick up that rare from your room before trading it." };
    if (Object.keys(items).length + rares.length > TRADE.maxLines) return { ok: false, msg: `Up to ${TRADE.maxLines} things per trade.` };
    const tk = Math.max(0, Math.min(TRADE.maxTk, Math.floor(+m.tk || 0))); if (tk > H.tk) return { ok: false, msg: "You don't have that many tokens." };
    T.side[i].offer = { items, rares: rares.map((r) => ({ id: r.id, item: r.item, serial: r.serial })), tk }; T.side[0].ok = false; T.side[1].ok = false; T.t = Date.now();
    this.tradePush(T); return { ok: true };
  }
  async tradeReady(a, m) {
    const [T, i] = this.tradeGet(a, m); if (!T || !T.open) return { ok: false, msg: "That trade is over." };
    T.side[i].ok = !!m.on; this.tradePush(T);
    if (!(T.side[0].ok && T.side[1].ok)) return { ok: true };
    const A = T.side[0], B = T.side[1], empty = (O) => !Object.keys(O.items).length && !O.rares.length && !O.tk;
    if (empty(A.offer) && empty(B.offer)) { A.ok = B.ok = false; this.tradePush(T); return { ok: false, msg: "Add something to the trade first." }; }
    const db = this.env.DB, st = [], now = Date.now();
    const give = (S, R) => {
      const O = S.offer, moves = new Map(Object.entries(O.items)); for (const r of O.rares) moves.set(r.item, (moves.get(r.item) || 0) + 1);
      if (O.tk > 0) st.push(db.prepare("UPDATE users SET tk = tk - ? WHERE id = ?").bind(O.tk, S.uid), db.prepare("UPDATE users SET tk = tk + ? WHERE id = ?").bind(O.tk, R.uid),
        db.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(S.uid, -O.tk, "trade to " + R.name, now), db.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(R.uid, O.tk, "trade from " + S.name, now));
      for (const [k, n] of moves) st.push(db.prepare("UPDATE finv SET n = n - ? WHERE uid = ? AND item = ?").bind(n, S.uid, k),
        db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN COALESCE((SELECT n FROM finv WHERE uid = ? AND item = ?), -1) >= (SELECT COUNT(*) FROM pfurn p JOIN prooms r ON r.id = p.room WHERE r.owner = ? AND p.item = ?) THEN 1 ELSE 0 END").bind(S.uid, k, S.uid, k),
        db.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, ?) ON CONFLICT(uid, item) DO UPDATE SET n = n + excluded.n").bind(R.uid, k, n));
      for (const r of O.rares) st.push(db.prepare("UPDATE rares SET owner = ? WHERE id = ? AND owner = ?").bind(R.uid, r.id, S.uid),
        db.prepare("INSERT INTO trade_guard (ok) SELECT CASE WHEN (SELECT owner FROM rares WHERE id = ?) = ? THEN 1 ELSE 0 END").bind(r.id, R.uid));
    };
    give(A, B); give(B, A);
    st.push(db.prepare("DELETE FROM finv WHERE n <= 0 AND uid IN (?, ?)").bind(A.uid, B.uid), db.prepare("DELETE FROM trade_guard"),
      db.prepare("INSERT INTO trades (t, a, b, a_gave, b_gave) VALUES (?, ?, ?, ?, ?)").bind(now, A.uid, B.uid, JSON.stringify(A.offer), JSON.stringify(B.offer)));
    try { await db.batch(st); }
    catch (e) { console.log("trade refused", e && e.message); A.ok = B.ok = false; this.tradePush(T); return { ok: false, msg: "The trade didn't go through: something changed (a piece was placed, or tokens were spent). Check the offers and try again." }; }
    this.tradeEnd(T, "TRADE DONE!");
    for (const S of [A, B]) { const [w, x] = this.sockOf(S.uid); const u = await this.user(S.uid); if (w) { if (x) { x.uc = { ...(x.uc || {}), t: Date.now(), tk: u.tk }; w.serializeAttachment(x); } this.send(w, { t: "tradedone", tk: u.tk, furn: await this.furnStorage(S.uid), rares: await this.rareInfo(S.uid) }); } }
    return { ok: true };
  }

  // ---------- daily rewards and quests ----------
  async dailyTable() { if (this.dailyReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS daily (uid INTEGER PRIMARY KEY, claim_day TEXT NOT NULL DEFAULT '', streak INTEGER NOT NULL DEFAULT 0, qday TEXT NOT NULL DEFAULT '', prog TEXT NOT NULL DEFAULT '{}', bonus INTEGER NOT NULL DEFAULT 0)").run(); this.dailyReady = true; }
  async dailyRow(uid, today) {
    await this.dailyTable();
    let r = await this.env.DB.prepare("SELECT * FROM daily WHERE uid = ?").bind(uid).first();
    if (!r) { await this.env.DB.prepare("INSERT OR IGNORE INTO daily (uid) VALUES (?)").bind(uid).run(); r = { uid, claim_day: "", streak: 0, qday: "", prog: "{}", bonus: 0 }; }
    if (r.qday !== today) { r.qday = today; r.prog = "{}"; r.bonus = 0; await this.env.DB.prepare("UPDATE daily SET qday = ?, prog = '{}', bonus = 0 WHERE uid = ?").bind(today, uid).run(); }
    let prog = {}; try { prog = JSON.parse(r.prog || "{}") || {}; } catch (e) {}
    return { ...r, prog };
  }
  dailyOut(uid, r, now) {
    const today = etDay(now), yest = etDay(now - 86400000), claimed = r.claim_day === today;
    const streak = claimed ? r.streak : (r.claim_day === yest ? r.streak + 1 : 1);   // what today's claim makes it
    const qs = questsFor(uid, today).map((k) => ({ k, t: QUESTS[k].t, n: QUESTS[k].n, pay: QUESTS[k].pay, prog: Math.min(QUESTS[k].n, +r.prog[k] || 0), done: (+r.prog[k] || 0) >= QUESTS[k].n }));
    return { ok: true, day: today, claimed, streak, reward: DAILY.rewards[(streak - 1) % 7], rewards: DAILY.rewards, quests: qs, bonus: { pay: DAILY.bonus, done: !!r.bonus } };
  }
  async dailyInfo(a, now) { const r = await this.dailyRow(a.uid, etDay(now)); return this.dailyOut(a.uid, r, now); }
  async dailyClaim(a, now) {
    const today = etDay(now), r = await this.dailyRow(a.uid, today);
    if (r.claim_day === today) return { ok: false, msg: "You already got today's reward. Come back tomorrow!" };
    const streak = r.claim_day === etDay(now - 86400000) ? r.streak + 1 : 1, pay = DAILY.rewards[(streak - 1) % 7];
    const ch = await this.env.DB.prepare("UPDATE daily SET claim_day = ?, streak = ? WHERE uid = ? AND claim_day != ?").bind(today, streak, a.uid, today).run();
    if (!ch.meta.changes) return { ok: false, msg: "You already got today's reward." };   // two taps at once only pay once
    const tk = await this.credit(a.uid, pay, "daily reward day " + streak);
    return { ...this.dailyOut(a.uid, { ...r, claim_day: today, streak }, now), tk, paid: pay };
  }
  async questTick(ws, uid, k) {
    const now = Date.now(), today = etDay(now); if (!questsFor(uid, today).includes(k)) return;
    const r = await this.dailyRow(uid, today), Q = QUESTS[k], before = +r.prog[k] || 0; if (before >= Q.n) return;
    r.prog[k] = before + 1;
    await this.env.DB.prepare("UPDATE daily SET prog = ? WHERE uid = ? AND qday = ?").bind(JSON.stringify(r.prog), uid, today).run();
    let tk = null, msg = null;
    if (r.prog[k] >= Q.n) {
      tk = await this.credit(uid, Q.pay, "quest " + k); msg = `QUEST DONE: ${Q.t}! +${Q.pay} TOKENS`;
      const all = questsFor(uid, today).every((q) => (+r.prog[q] || 0) >= QUESTS[q].n);
      if (all && !r.bonus) { const b = await this.env.DB.prepare("UPDATE daily SET bonus = 1 WHERE uid = ? AND bonus = 0").bind(uid).run();
        if (b.meta.changes) { r.bonus = 1; tk = await this.credit(uid, DAILY.bonus, "quests bonus"); msg += ` · ALL 3 DONE! +${DAILY.bonus} BONUS`; } }
    }
    this.send(ws, { t: "quest", msg, tk, info: this.dailyOut(uid, r, now) });
  }

  // ---------- chat log (staff only) ----------
  async chatTable() { if (this.chatReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS chatlog (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, uid INTEGER NOT NULL, name TEXT NOT NULL, rm TEXT NOT NULL, text TEXT NOT NULL, mu INTEGER NOT NULL DEFAULT 0)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS chatlog_uid ON chatlog (uid, id)").run(); this.chatReady = true; }
  async chatLog(a, rm, text, muted) {
    await this.chatTable();
    const now = Date.now();
    await this.env.DB.prepare("INSERT INTO chatlog (t, uid, name, rm, text, mu) VALUES (?, ?, ?, ?, ?, ?)").bind(now, a.uid, a.name, (ROOM_IDS.has(rm) || prId(rm)) ? rm : "lounge", text, muted ? 1 : 0).run();
  }
  async dashChat(a, m) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can see the chat log." };
    await this.chatTable();
    const before = Number.isInteger(m.before) && m.before > 0 ? m.before : 2 ** 53, q = String(m.q || "").trim();
    const rows = /^[A-Za-z0-9_]{1,12}$/.test(q)
      ? await this.env.DB.prepare("SELECT c.*, u.role, u.muted, u.banned FROM chatlog c JOIN users u ON u.id = c.uid WHERE c.id < ? AND c.name LIKE ? ORDER BY c.id DESC LIMIT 80").bind(before, q + "%").all()
      : await this.env.DB.prepare("SELECT c.*, u.role, u.muted, u.banned FROM chatlog c JOIN users u ON u.id = c.uid WHERE c.id < ? ORDER BY c.id DESC LIMIT 80").bind(before).all();
    return { ok: true, me: a.staff, lines: (rows.results || []).map((r) => ({ id: r.id, t: r.t, n: r.name.toUpperCase(), rm: r.rm, text: r.text, mu: r.mu, st: r.role === "admin" ? "owner" : r.role === "mod" ? "mod" : "", muted: !!r.muted, banned: !!r.banned })) };
  }

  // ---------- private messages between friends ----------
  async dmTable() { if (this.dmReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS dms (id INTEGER PRIMARY KEY AUTOINCREMENT, a INTEGER NOT NULL, b INTEGER NOT NULL, t INTEGER NOT NULL, text TEXT NOT NULL, rd INTEGER NOT NULL DEFAULT 0)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_ab ON dms (a, b, id)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_b ON dms (b, rd)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_at ON dms (a, t)").run(); this.dmReady = true; }
  async dmSend(ws, a, m) {
    await this.dmTable(); await this.frTable();
    const now = Date.now(); if (!a.dmr || now - a.dmr[0] > 10000) a.dmr = [now, 0]; if (++a.dmr[1] > DM.burst) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down a little." }; } ws.serializeAttachment(a);
    const text = WF.mask(String(m.text || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, DM.len));
    if (!text) return { ok: false, msg: "Type a message first." };
    if (WF.slur(text)) { await this.wfHit(ws, a, "blocked DM"); return { ok: false, msg: "That message has a word that isn't allowed here." }; }
    if (/\*{3,}/.test(text) && WF.mask(String(m.text || "")) !== String(m.text || "")) await this.wfHit(ws, a, "masked DM");
    const me = await this.user(a.uid); if (!me || me.banned) return { ok: false, msg: "You can't send messages." };
    if (me.muted) return { ok: false, msg: "You're muted, so you can't send messages right now." };
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    if (!T.row || T.row.st !== "ok") return { ok: false, msg: "You can only message friends." };
    const dayStart = Date.parse(etDay(now) + "T00:00:00Z") - 12 * 3600e3;   // a little before midnight Eastern, then counted exactly below
    const sent = await this.env.DB.prepare("SELECT t FROM dms WHERE a = ? AND t > ? ORDER BY t DESC LIMIT ?").bind(a.uid, dayStart, DM.perDay + 1).all();
    if ((sent.results || []).filter((r) => etDay(r.t) === etDay(now)).length >= DM.perDay) return { ok: false, msg: `You've sent ${DM.perDay} messages today. You can send more tomorrow.` };
    const r = await this.env.DB.prepare("INSERT INTO dms (a, b, t, text) VALUES (?, ?, ?, ?) RETURNING id").bind(a.uid, T.u.id, now, text).first();
    const msg = { id: r.id, from: a.name, to: T.u.name.toUpperCase(), t: now, text };
    this.toUid(T.u.id, { t: "dm", m: msg });
    return { ok: true, m: msg };
  }
  async dmInbox(uid) {
    await this.dmTable();
    const rows = (await this.env.DB.prepare(`SELECT x.o, x.mid, x.un, u.name, d.text, d.t, d.a FROM (SELECT CASE WHEN a = ? THEN b ELSE a END AS o, MAX(id) AS mid, SUM(CASE WHEN b = ? AND rd = 0 THEN 1 ELSE 0 END) AS un FROM dms WHERE a = ? OR b = ? GROUP BY o) x JOIN users u ON u.id = x.o JOIN dms d ON d.id = x.mid WHERE u.banned = 0 ORDER BY x.mid DESC LIMIT 50`).bind(uid, uid, uid, uid).all()).results || [];
    return rows.map((r) => ({ n: r.name.toUpperCase(), un: r.un || 0, last: r.text, t: r.t, mine: r.a === uid }));
  }
  async dmThread(a, m) {
    await this.dmTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const rows = (await this.env.DB.prepare("SELECT id, a, t, text FROM dms WHERE (a = ? AND b = ?) OR (a = ? AND b = ?) ORDER BY id DESC LIMIT 60").bind(a.uid, T.u.id, T.u.id, a.uid).all()).results || [];
    await this.env.DB.prepare("UPDATE dms SET rd = 1 WHERE a = ? AND b = ? AND rd = 0").bind(T.u.id, a.uid).run();
    return { ok: true, n: T.u.name.toUpperCase(), friend: !!(T.row && T.row.st === "ok"), msgs: rows.reverse().map((r) => ({ id: r.id, mine: r.a === a.uid, t: r.t, text: r.text })) };
  }

  // ---------- friends ----------
  // One row per pair: a asked b. st is 'req' until b accepts, then 'ok'. Either side can remove it.
  async frTable() { if (this.frReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER NOT NULL, b INTEGER NOT NULL, st TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (a, b))").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS friends_b ON friends (b)").run(); this.frReady = true; }
  async frList(uid) {
    await this.frTable();
    const rows = (await this.env.DB.prepare("SELECT f.a, f.st, u.name, u.c FROM friends f JOIN users u ON u.id = CASE WHEN f.a = ? THEN f.b ELSE f.a END WHERE (f.a = ? OR f.b = ?) AND u.banned = 0 ORDER BY u.name").bind(uid, uid, uid).all()).results || [];
    const out = { friends: [], inc: [], out: [], c: {} };
    for (const r of rows) { (r.st === "ok" ? out.friends : r.a === uid ? out.out : out.inc).push(r.name.toUpperCase()); if (r.c) out.c[r.name.toUpperCase()] = r.c; }
    return out;
  }
  toUid(uid, obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === uid) { try { w.send(s); } catch (e) {} } } }
  async frTarget(a, m) {
    const n = String(m.n || "").trim();
    if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { err: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name, banned FROM users WHERE name = ?").bind(n).first();
    if (!u || u.banned) return { err: "No llama has that name." };
    if (u.id === a.uid) return { err: "You're already your own best friend!" };
    const row = await this.env.DB.prepare("SELECT a, b, st FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(a.uid, u.id, u.id, a.uid).first();
    return { u, row };
  }
  // invite a friend to whatever room you're in right now (they get a pop-up to come over)
  async roomInvite(ws, a, m) {
    await this.frTable();
    const now = Date.now(); if (!a.ri || now - a.ri[0] > 60000) a.ri = [now, 0]; if (++a.ri[1] > 12) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down on the invites. Try again in a minute." }; } ws.serializeAttachment(a);
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (!row || row.st !== "ok") return { ok: false, msg: `You can only invite friends. Add ${them} first.` };
    const rm = a.pres && a.pres.rm; if (!rm) return { ok: false, msg: "Walk into a room first." };
    let online = false, here = false;
    for (const w2 of this.sockets()) { const x = w2.deserializeAttachment(); if (x && x.uid === u.id) { online = true; if (x.pres && x.pres.rm === rm) here = true; } }
    if (!online) return { ok: false, msg: `${them} isn't online right now.` };
    if (here) return { ok: false, msg: `${them} is already here with you.` };
    if (!this.rinv) this.rinv = new Map(); const k = a.uid + ":" + u.id; if (now - (this.rinv.get(k) || 0) < 30000) return { ok: false, msg: `You just invited ${them}. Give them a moment.` }; this.rinv.set(k, now);
    let name = null;
    if (rm.startsWith("p:")) {
      const r = await this.prRoom(Math.floor(+rm.slice(2) || 0)); if (!r) return { ok: false, msg: "This room is gone." };
      if (r.priv) { if (r.owner !== a.uid) return { ok: false, msg: "This room is private. Only its owner can invite people." };
        await this.env.DB.prepare("INSERT OR IGNORE INTO pinv (room, uid) VALUES (?, ?)").bind(r.id, u.id).run(); }
      name = r.name;
    }
    this.toUid(u.id, { t: "rinv", by: a.name, rm, name });
    return { ok: true, msg: `Invite sent to ${them}!` };
  }
  async frAdd(ws, a, m) {
    await this.frTable();
    const now = Date.now(); if (!a.fr || now - a.fr[0] > 60000) a.fr = [now, 0]; if (++a.fr[1] > 10) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down on the friend requests. Try again in a minute." }; } ws.serializeAttachment(a);
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (await this.blockedPair(a.uid, u.id)) return { ok: false, msg: `You can't add ${them}.` };
    if (row && row.st === "ok") return { ok: false, msg: `You and ${them} are already friends.` };
    if (row && row.a === a.uid) return { ok: false, msg: `You already asked ${them}. Waiting for them to accept.` };
    if (row) return this.frAccept(a, m);   // they already asked you, so this just accepts
    const mine = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM friends WHERE a = ? OR (b = ? AND st = 'ok')").bind(a.uid, a.uid).first();
    if (mine.n >= FRIENDS.max) return { ok: false, msg: `You can have up to ${FRIENDS.max} friends and requests. Remove some first.` };
    const theirs = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM friends WHERE b = ? AND st = 'req'").bind(u.id).first();
    if (theirs.n >= FRIENDS.inbox) return { ok: false, msg: `${them} has too many friend requests waiting right now.` };
    await this.env.DB.prepare("INSERT OR IGNORE INTO friends (a, b, st, t) VALUES (?, ?, 'req', ?)").bind(a.uid, u.id, now).run();
    this.toUid(u.id, { t: "fr", ev: "req", n: a.name, fr: await this.frList(u.id) });
    return { ok: true, msg: `Friend request sent to ${them}!`, fr: await this.frList(a.uid) };
  }
  async frAccept(a, m) {
    await this.frTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (!row || row.st !== "req" || row.a !== u.id) return { ok: false, msg: `${them} hasn't sent you a request.` };
    await this.env.DB.prepare("UPDATE friends SET st = 'ok', t = ? WHERE a = ? AND b = ?").bind(Date.now(), u.id, a.uid).run();
    this.toUid(u.id, { t: "fr", ev: "acc", n: a.name, fr: await this.frList(u.id) });
    return { ok: true, msg: `You and ${them} are now friends!`, fr: await this.frList(a.uid) };
  }
  async frDrop(a, m, why) {   // decline a request, cancel your own, or unfriend
    await this.frTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T;
    if (!row) return { ok: true, fr: await this.frList(a.uid) };
    if (why === "decline" && !(row.st === "req" && row.a === u.id)) return { ok: false, msg: "There's no request to decline." };
    await this.env.DB.prepare("DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(a.uid, u.id, u.id, a.uid).run();
    this.toUid(u.id, { t: "fr", ev: "upd", fr: await this.frList(u.id) });   // their list just updates quietly
    return { ok: true, fr: await this.frList(a.uid) };
  }

  // ---------- database helpers ----------
  async user(uid) { return this.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first(); }
  async credit(uid, n, why) {
    if (n <= 0) return (await this.user(uid)).tk;
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk + ? WHERE id = ? RETURNING tk").bind(n, uid).first();
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(uid, n, why, Date.now()).run();
    return r.tk;
  }
  async debit(uid, n, why) {   // returns new balance, or null if they can't afford it
    if (n <= 0) return (await this.user(uid)).tk;
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk - ? WHERE id = ? AND tk >= ? RETURNING tk").bind(n, uid, n).first();
    if (!r) return null;
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(uid, -n, why, Date.now()).run();
    return r.tk;
  }
  async timer(uid, k) { const r = await this.env.DB.prepare("SELECT t FROM timers WHERE uid = ? AND k = ?").bind(uid, k).first(); return r ? r.t : 0; }
  async setTimer(uid, k, t) { await this.env.DB.prepare("INSERT INTO timers (uid, k, t) VALUES (?, ?, ?) ON CONFLICT(uid, k) DO UPDATE SET t = excluded.t").bind(uid, k, t).run(); }
  async clearTimer(uid, k) { await this.env.DB.prepare("DELETE FROM timers WHERE uid = ? AND k = ?").bind(uid, k).run(); }
  async board() {
    const top = async (col) => ((await this.env.DB.prepare(`SELECT name, ${col} AS s FROM users WHERE ${col} > 0 AND banned = 0 ORDER BY ${col} DESC LIMIT 5`).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { hay: await top("best_hay"), dash: await top("best_dash") };
  }
  near(a, rm, fn) { const p = a.pres; return !!(p && p.rm === rm && Number.isFinite(p.x) && Number.isFinite(p.y) && fn(p.x - 0.5, p.y - 0.5, p)); }

  // ---------- every token-changing action goes through here ----------
  async act(ws, a, kind, m) {
    const uid = a.uid, now = Date.now();
    switch (kind) {
      case "profile": {
        const c = LLAMAS.includes(m.c) ? m.c : null;
        const bet = Math.max(0, Math.min(10, Math.floor(+m.bet || 0)));
        // the llama picked at sign-up is the account's llama for good: once it's set, it never changes
        await this.env.DB.prepare("UPDATE users SET c = COALESCE(c, ?), agreed = MAX(agreed, ?), bet = ? WHERE id = ?").bind(c, Math.max(0, Math.min(9, +m.agreed || 0)), bet, uid).run();
        return { ok: true };
      }
      case "drink": {
        if (!this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.round(y) === 2)) return { ok: false, msg: "Sit at the bar first." };
        const tk = await this.debit(uid, 1, "drink"); if (tk === null) return { ok: false, msg: "Drinks cost 1 TOKEN. Earn some at the arcade, the bar or LLAMA ACRES!" };
        await this.holdFood(uid, { th: 33 });   // a 1-token bar drink: a third of the thirst meter
        return { ok: true, tk, nd: this.needsOut(a) };
      }
      case "slot": {
        let sx = -1; if (!this.near(a, "casino", (x, y, p) => { sx = Math.round(x); return p.p === "sit" && Math.round(y) === 1 && SLOT_X.includes(sx); })) return { ok: false, msg: "Sit at a slot machine first." };
        const bet = SLOT_BETS.includes(+m.bet) ? +m.bet : 1, kind = slotKind(sx);
        if (now - (await this.timer(uid, "slot")) < 1300) return { ok: false, msg: "The reels are still spinning." };
        await this.setTimer(uid, "slot", now);
        let tk = await this.debit(uid, bet, "slot spin"); if (tk === null) return { ok: false, msg: `YOU NEED ${bet} TOKEN${bet > 1 ? "S" : ""} TO SPIN.` };
        let r, pay = 0, lines = [];
        if (kind === "fruit") { const M = SLOTS.fruit; r = [pickW(M.w), pickW(M.w), pickW(M.w)]; if (r[0] === r[1] && r[1] === r[2]) pay = M.pay[r[0]] * bet; }
        else if (kind === "classic") { const M = SLOTS.classic; r = Array.from({ length: 9 }, () => pickW(M.w));
          SLOT_LINES.forEach((L, i) => { if (r[L[0]] === r[L[1]] && r[L[1]] === r[L[2]]) { lines.push(i); pay += M.pay[r[L[0]]] * bet; } }); }
        else { const seg = pickW(WHEEL.slices.map((v) => WHEEL.weight[v])); r = [seg]; pay = WHEEL.slices[seg] * bet; }
        if (pay) { tk = await this.credit(uid, pay, "slot win"); const nm = a.name; setTimeout(() => { try { this.roomCast("casino", { t: "win", n: nm, pay, big: pay >= bet * 20 }); } catch (e) {} }, kind === "gold" ? 4200 : 2000); }
        return { ok: true, kind, r, lines, pay, bet, tk };
      }
      case "plinko": {
        // the ball's path is decided here: 8 rows, each a fair left/right bounce; the bucket is the number of rights
        if (!this.near(a, "casino", (x, y, p) => p.p !== "sit" && Math.round(x) <= 1 && Math.round(y) >= PLINKO.y - 1 && Math.round(y) <= PLINKO.y + 2)) return { ok: false, msg: "Walk up to the PLINKO machine first." };
        const bet = PLINKO.bets.includes(+m.bet) ? +m.bet : 1;
        if (now - (await this.timer(uid, "plinko")) < 300) return { ok: false, msg: "One ball at a time!" };   // several can be falling; just not two in the same instant
        await this.setTimer(uid, "plinko", now);
        let tk = await this.debit(uid, bet, "plinko"); if (tk === null) return { ok: false, msg: `YOU NEED ${bet} TOKEN${bet > 1 ? "S" : ""} TO DROP A BALL.` };
        const path = Array.from({ length: PLINKO.rows }, () => (Math.random() < 0.5 ? 0 : 1)), slot = path.reduce((s, v) => s + v, 0), pay = Math.round(bet * PLINKO.mult[slot]);
        if (pay) tk = await this.credit(uid, pay, "plinko win");
        return { ok: true, path, slot, pay, bet, tk };
      }
      case "harvest": {
        const k = String(m.k || ""); if (!CROP_KEYS.has(k)) return { ok: false };
        const [cx, cy] = k.split(",").map(Number);
        if (!this.near(a, "barn", (x, y) => Math.abs(x - cx) <= 1.6 && Math.abs(y - cy) <= 1.6)) return { ok: false, msg: "Walk up to the plot first." };
        const ready = await this.timer(uid, "crop:" + k);
        if (now < ready) return { ok: false, left: ready - now, msg: `Those carrots are still growing. Ready in ${Math.ceil((ready - now) / 1000)}s.` };
        await this.setTimer(uid, "crop:" + k, now + CROP_MS);
        return { ok: true, left: CROP_MS, tk: await this.credit(uid, 1, "harvest") };
      }
      case "llama_change": {   // the changing booth: you have to be standing at it, and it costs 10 tokens
        const c = String(m.c || ""); if (!LLAMAS.includes(c)) return { ok: false, msg: "That llama doesn't exist." };
        if (!this.near(a, BOOTH.rm, (x, y, p) => p.p !== "sit" && Math.abs(x - BOOTH.x) <= 1.6 && Math.abs(y - BOOTH.y) <= 1.6)) return { ok: false, msg: "Walk up to the changing booth in the ACCOUNT room first." };
        const u = await this.user(uid); if (u && u.c === c) return { ok: false, msg: "That's already you! Pick a different llama." };
        const tk = await this.debit(uid, BOOTH.price, "llama change " + c); if (tk === null) return { ok: false, msg: `The booth costs ${BOOTH.price} TOKENS. Play some games to earn more!` };
        await this.env.DB.prepare("UPDATE users SET c = ? WHERE id = ?").bind(c, uid).run();
        a.uc = { ...(a.uc || {}), t: now, tk, c }; if (a.pres) { a.pres.c = c; a.pres.tk = tk; this.peersOut(ws, a, "updated"); } ws.serializeAttachment(a);
        return { ok: true, c, tk };
      }
      case "backup_list": case "backup_now": case "backup_get": {   // owner only: backups hold emails and password hashes
        const u = await this.user(uid); if (staffRole(this.env, u) !== "owner" || u.banned) return { ok: false, msg: "Only the owner can see backups." };
        if (!this.env.BACKUP) return { ok: false, msg: "Backups aren't set up on this server." };
        await backupTables(this.env);
        if (kind === "backup_now") { if (now - (this.lastBackup || 0) < 120000) return { ok: false, msg: "A backup was just made. Try again in a couple of minutes." };
          this.lastBackup = now; const b = await makeBackup(this.env, "by " + a.name); return { ok: true, msg: `Backup saved: ${b.rows} rows.` }; }
        if (kind === "backup_get") { const bid = Math.floor(+m.bid || 0), part = Math.max(0, Math.floor(+m.part || 0));
          const b = await this.env.BACKUP.prepare("SELECT * FROM backups WHERE id = ?").bind(bid).first(); if (!b) return { ok: false, msg: "That backup is gone." };
          const p = await this.env.BACKUP.prepare("SELECT sql FROM backup_parts WHERE bid = ? AND part = ?").bind(bid, part).first();
          return { ok: true, sql: p ? p.sql : "", part, parts: b.parts, at: b.t }; }   // "t" is taken: it marks the reply
        const list = (await this.env.BACKUP.prepare("SELECT id, t, why, tables, rows, bytes, parts FROM backups ORDER BY id DESC").all()).results || [];
        return { ok: true, list };
      }
      case "afk_ok": { a.act = now; ws.serializeAttachment(a); return { ok: true }; }
      case "fish_cast": {
        if (now - (a.act || 0) > AFK_MS) return { ok: false, afk: true, msg: "Are you still there? Tap I'M STILL HERE to keep fishing." };
        if (!this.near(a, "barn", (x, y) => x >= POND.x0 - 1.6 && x <= POND.x1 + 1.6 && y >= POND.y0 - 1.6 && y <= POND.y1 + 1.6)) return { ok: false, msg: "Stand next to the pond to fish." };
        const bite = 10000 + rnd(10000);
        await this.setTimer(uid, "fish", now + bite);
        return { ok: true, bite };
      }
      case "fish_reel": {
        const t = await this.timer(uid, "fish");
        if (!t || now < t - 300 || now > t + 60000) return { ok: false, msg: "Nothing on the line." };   // a minute to reel, so a background tab still makes it
        await this.clearTimer(uid, "fish");
        const f = pickW(FISH.map((x) => x.w));
        return { ok: true, f, pay: FISH[f].pay, name: FISH[f].n, tk: await this.credit(uid, Math.max(1, halfIfEmpty(a, FISH[f].pay)), "fish") };
      }
      case "bar_tick": {
        if (now - (a.act || 0) > AFK_MS) return { ok: false, afk: true };
        if (!this.near(a, "lounge", (x, y, p) => p.p === "bar" && y < 1.2)) { await this.clearTimer(uid, "bar"); return { ok: false }; }
        const last = await this.timer(uid, "bar");
        if (!last) { await this.setTimer(uid, "bar", now); return { ok: true, started: true }; }
        if (now - last < BAR_MS - 1500) return { ok: false };
        await this.setTimer(uid, "bar", now);
        return { ok: true, tk: await this.credit(uid, 1, "bar tips") };
      }
      case "bar_off": { await this.clearTimer(uid, "bar"); return { ok: true }; }
      // helping the LLAMA STORE cashier: wipe the counter from behind it (either side of Penny); pays like the bar
      case "shop_tick": {
        if (now - (a.act || 0) > AFK_MS) return { ok: false, afk: true };
        if (!this.near(a, "store", (x, y, p) => p.p === "wipe" && y >= 0 && y < 2 && x >= 7 && x < 10)) { await this.clearTimer(uid, "shop"); return { ok: false }; }
        const last = await this.timer(uid, "shop");
        if (!last) { await this.setTimer(uid, "shop", now); return { ok: true, started: true }; }
        if (now - last < BAR_MS - 1500) return { ok: false };
        await this.setTimer(uid, "shop", now);
        return { ok: true, tk: await this.credit(uid, 1, "store helper") };
      }
      case "shop_off": { await this.clearTimer(uid, "shop"); return { ok: true }; }
      case "arcade": {
        const id = m.game === "dash" ? "dash" : "hay", score = Math.max(0, Math.floor(+m.score || 0)), ms = Math.max(0, +m.ms || 0);
        // plausibility: nobody scores faster than the game allows
        const maxRate = id === "hay" ? 25 : 24; if (ms < 3000 || score > (ms / 1000) * maxRate + 5) return { ok: false, msg: "That score didn't add up." };
        if (now - (await this.timer(uid, "arcade")) < Math.min(ms, 15000) - 500) return { ok: false };
        await this.setTimer(uid, "arcade", now);
        const col = id === "hay" ? "best_hay" : "best_dash";
        const u = await this.user(uid); const isBest = score > u[col];
        if (isBest) await this.env.DB.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).bind(score, uid).run();
        let earn = Math.min(10, Math.floor(score / (id === "hay" ? 10 : 50))); if (isBest && score > 0) earn += 3; earn = halfIfEmpty(a, earn);
        const tk = await this.credit(uid, earn, "arcade " + id);
        if (isBest) this.broadcast({ t: "board", board: await this.board() });
        return { ok: true, earned: earn, best: isBest, tk };
      }
      case "apple": {
        if (!this.near(a, "barn", () => true)) return { ok: false };
        if (now - (a.nd && a.nd.apple || 0) < NEEDS.appleGap) return { ok: true, full: 0, nd: this.needsOut(a) };
        a.nd.apple = now; await this.needsEat(ws, a, { hu: NEEDS.apple }, now);
        return { ok: true, full: NEEDS.apple, nd: this.needsOut(a) };
      }
      case "buy": {
        const k = String(m.k || ""); const S = Object.hasOwn(STANDS, m.s) ? STANDS[m.s] : null; let cost = 0;
        if (m.s === "pv") {   // a machine in a player room: you must be in that room, next to that machine
          const rm = a.pres && a.pres.rm, rid = rm && rm.startsWith("p:") ? Math.floor(+rm.slice(2) || 0) : 0;
          if (!rid || a.proom !== rid) return { ok: false, msg: "Walk up to the machine first." };
          const f = await this.env.DB.prepare("SELECT item, gx, gy FROM pfurn WHERE id = ? AND room = ?").bind(Math.floor(+m.fid || 0), rid).first();
          if (!f || !PV_ITEMS[f.item]) return { ok: false, msg: "That machine is gone." };
          if (!this.near(a, rm, (x, y) => Math.abs(x - f.gx) <= 1.6 && Math.abs(y - f.gy) <= 1.6)) return { ok: false, msg: "Walk up to the machine first." };
          cost = Object.hasOwn(PV_ITEMS[f.item], k) ? PV_ITEMS[f.item][k] : 0;
          if (!cost) return { ok: false, msg: "That machine doesn't sell that." };
        } else {
          cost = S && Object.hasOwn(S.items, k) ? S.items[k] : 0;
          if (!cost) return { ok: false, msg: "They don't sell that here." };
          if (m.s === "bar") { if (!this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.round(y) === 2)) return { ok: false, msg: "Sit at the bar first." }; }
          else if (!this.near(a, S.rm, (x, y) => Math.abs(x - S.x) <= 2.1 && Math.abs(y - S.y) <= 1.6)) return { ok: false, msg: "Walk up to the stand first." };
        }
        const tk = await this.debit(uid, cost, "stand " + k); if (tk === null) return { ok: false, msg: `That costs ${cost} TOKENS. Play a game or harvest carrots to earn some!` };
        await this.holdFood(uid, FOOD[k] || {});   // fills a little with each sip or bite
        return { ok: true, k, tk, nd: this.needsOut(a) };
      }
      case "roulette": {
        if (!this.near(a, "casino", (x, y, p) => p.p === "sit" && ROUL_SEATS.some(([sx, sy]) => sx === Math.round(x) && sy === Math.round(y)))) return { ok: false, msg: "Sit at the roulette table first." };
        const kind = String(m.k || ""), num = Math.floor(+m.n), bet = TABLE_BETS.includes(+m.bet) ? +m.bet : 0;
        const straight = kind === "n" && num >= 0 && num <= 36;
        if (!bet || (!straight && !ROUL[kind])) return { ok: false, msg: "Pick a bet first." };
        if (now - (await this.timer(uid, "roul")) < 3200) return { ok: false, msg: "The ball is still rolling." };
        await this.setTimer(uid, "roul", now);
        let tk = await this.debit(uid, bet, "roulette bet"); if (tk === null) return { ok: false, msg: `You need ${bet} TOKEN${bet > 1 ? "S" : ""} for that bet.` };
        const n = rnd(37), won = straight ? n === num : ROUL[kind].win(n), pay = won ? bet * (straight ? 36 : ROUL[kind].back) : 0;
        if (pay) tk = await this.credit(uid, pay, "roulette win");
        this.broadcast({ t: "rl", n, by: a.name });   // everyone in the casino sees the wheel spin
        return { ok: true, n, pay, bet, tk };
      }
      case "bj": return this.blackjack(a, m, now);
      case "tg_start": return this.tableStart(ws, a, m);
      case "admin": return this.admin(a, m);
      case "dash": return this.dashboard(a);
      case "bug_report": return this.bugReport(a, m);
      case "block": return this.blockSet(a, m);
      case "block_list": return { ok: true, blocks: await this.blockList(a.uid) };
      case "report": return this.reportSend(a, m);
      case "report_list": return this.reportList(a);
      case "health": return this.health(a);
      case "health_clear": return this.healthClear(a);
      case "cap_set": return this.capSet(a, m);
      case "err_list": return this.errList(a);
      case "err_clear": return this.errClear(a, m);
      case "report_done": return this.reportDone(a, m);
      case "mod_info": return this.modInfo(a, m);
      case "wf_hit": { const now2 = Date.now(); if (a.wfT && now2 - a.wfT < 1500) return { ok: true }; a.wfT = now2; ws.serializeAttachment(a); await this.wfHit(ws, a, "blocked"); return { ok: true }; }
      case "kit_buy": return this.kitBuy(a, m);
      case "mkt_list": return this.mktList(a);
      case "mkt_sell": return this.mktSell(a, m);
      case "mkt_back": return this.mktBack(a, m);
      case "mkt_buy": return this.mktBuy(ws, a, m);
      case "bug_list": return this.bugList(a);
      case "bug_done": return this.bugEdit(a, m, false);
      case "bug_del": return this.bugEdit(a, m, true);
      case "box_info": return this.boxInfo(a, now);
      case "box_bot": return this.boxBot(ws, a, m, now);
      case "box_invite": return this.boxInvite(ws, a, m, now);
      case "box_answer": return this.boxAnswer(ws, a, m, now);
      case "box_move": return this.boxMove(a, m);
      case "box_leave": return this.boxLeave(a);
      case "box_quit": return this.boxQuit(a);
      case "cove_info": return this.coveInfo(a, now);
      case "cove_scan": return this.coveScan(a, now);
      case "cove_dig": return this.coveDig(ws, a, m, now);
      case "arena_info": return this.arenaInfo(a, now);
      case "arena_join": return this.arenaJoin(ws, a, m, now);
      case "arena_end": return this.arenaEnd(ws, a, m, now);
      case "dunk_throw": return this.dunkThrow(a, m, now);
      case "bowl_info": return this.bowlInfo(a, now);
      case "bowl_start": return this.bowlStart(a, now);
      case "bowl_roll": return this.bowlRoll(a, m, now);
      case "dash_chat": return this.dashChat(a, m);
      case "gift_undo": return this.giftUndo(a, m);
      case "daily_info":
        return this.dailyInfo(a, now);
      case "daily_claim":
        return this.dailyClaim(a, now);
      case "pr_like":
        return this.prLike(ws, a, m);
      case "pr_feature":
        return this.prFeature(a, m);
      case "pr_list": return this.prList(a);
      case "pr_create": return this.prCreate(a, m);
      case "pr_search": return this.prSearch(a, m);
      case "pr_info": return this.prInfo(a, m);
      case "pr_set": return this.prSet(a, m);
      case "pr_enter": return this.prEnter(ws, a, m);
      case "pr_knock": return this.prKnock(a, m, now);
      case "pr_answer": return this.prAnswer(a, m, now);
      case "pr_invite": return this.prInvite(a, m);
      case "pr_kick": return this.prKick(a, m);
      case "pr_pw": return this.prPassword(a, m);
      case "pr_delete": return this.prDelete(a, m);
      case "farm_plant": return this.farmAct(ws, a, m, "plant");
      case "farm_water": return this.farmAct(ws, a, m, "water");
      case "farm_harvest": return this.farmAct(ws, a, m, "harvest");
      case "pr_place": return this.prPlace(a, m);
      case "pr_move": return this.prMove(a, m);
      case "pr_toggle": return this.prToggle(ws, a, m);
      case "pr_rot": return this.prEditPiece(a, m, "rot");
      case "pr_pick": return this.prEditPiece(a, m, "pick");
      case "pr_staff": return this.prStaff(a, m);
      case "furn_info": return { ok: true, furn: await this.furnStorage(uid), deco: await this.decoOwned(uid), rares: await this.rareInfo(uid), tiles: await this.tileStock(uid) };
      case "tile_buy": return this.tileBuy(a, m);
      case "tile_put": return this.tilePut(a, m);
      case "rare_buy": return this.rareBuy(a, m);
      case "trade_req": return this.tradeReq(ws, a, m);
      case "trade_answer": return this.tradeAnswer(a, m);
      case "trade_set": return this.tradeSet(a, m);
      case "trade_ready": return this.tradeReady(a, m);
      case "trade_cancel": { const [T] = this.tradeGet(a, m); if (T) this.tradeEnd(T, `${a.name} cancelled the trade.`); return { ok: true }; }
      case "deco_buy": return this.decoBuy(a, m);
      case "furn_buy": return this.furnBuy(a, m);
      case "inv_info": return { ok: true, ...(await this.invInfo(uid)), w: a.wear || {} };
      case "inv_buy": return this.invBuy(ws, a, m);
      case "inv_wear": return this.invWear(ws, a, m);
      case "dm_send": return this.dmSend(ws, a, m);
      case "dm_inbox": return { ok: true, inbox: await this.dmInbox(uid) };
      case "dm_thread": return this.dmThread(a, m);
      case "dm_read": { const T = await this.frTarget(a, m); if (!T.err) { await this.dmTable(); await this.env.DB.prepare("UPDATE dms SET rd = 1 WHERE a = ? AND b = ? AND rd = 0").bind(T.u.id, uid).run(); } return { ok: true }; }
      case "sip": return this.sipHeld(ws, a, now);
      case "fr_list": return { ok: true, fr: await this.frList(uid) };
      case "item_stats": return { ok: true, ...(await this.itemStats()) };
      case "who": {
        // a public profile card for another llama: nothing private (no tokens, email or friends)
        const k = "who:" + uid; const lim = (this.whoLim = this.whoLim || new Map()); const w = lim.get(k) || { t: now, n: 0 };
        if (now - w.t > 60000) { w.t = now; w.n = 0; } w.n++; lim.set(k, w); if (w.n > 30) return { ok: false, msg: "Slow down a little." };
        return await this.whoCard(String(m.n || "").trim());
      }
      case "fr_add": return this.frAdd(ws, a, m);
      case "room_invite": return this.roomInvite(ws, a, m);
      case "fr_accept": return this.frAccept(a, m);
      case "fr_decline": return this.frDrop(a, m, "decline");
      case "fr_remove": return this.frDrop(a, m, "remove");
      case "bowl_quit": { await this.ctx.storage.delete("bowl:" + a.uid); this.bowlLiveDrop(a.uid); return { ok: true }; }
    }
    return { ok: false, msg: "The game was just updated. Refresh the page to get the newest version." };
  }

  // ---------- blackjack: one hand per player against the dealer, kept in this room's storage between moves ----------
  async blackjack(a, m, now) {
    const uid = a.uid, key = "bj:" + uid, cmd = String(m.c || "");
    if (!this.near(a, "casino", (x, y, p) => p.p === "sit" && BJ_SEATS.some(([sx, sy]) => sx === Math.round(x) && sy === Math.round(y)))) return { ok: false, msg: "Sit at a blackjack table first." };
    let h = await this.ctx.storage.get(key);
    const view = (h, extra = {}) => ({ ok: true, p: h.p, d: h.done ? h.d : [h.d[0], -1], pt: handTotal(h.p), dt: h.done ? handTotal(h.d) : cardVal(h.d[0]), bet: h.bet, done: !!h.done, res: h.res || null, canDouble: !h.done && h.p.length === 2, ...extra });
    const finish = async (h, res) => {   // settle the hand and pay out
      h.done = true; h.res = res; await this.ctx.storage.delete(key);
      const back = res === "bj" ? Math.floor(h.bet * 2.5) : res === "win" ? h.bet * 2 : res === "push" ? h.bet : 0;
      const tk = back ? await this.credit(uid, back, "blackjack " + res) : (await this.user(uid)).tk;
      return view(h, { tk, back });
    };
    const dealerPlays = async (h) => { while (handTotal(h.d) < 17) h.d.push(h.deck.pop());
      const pt = handTotal(h.p), dt = handTotal(h.d); return finish(h, dt > 21 || pt > dt ? "win" : pt === dt ? "push" : "lose"); };
    if (cmd === "state") return h ? view(h) : { ok: true, idle: true };
    if (cmd === "deal") {
      if (h) return view(h);   // a hand is already going: pick it back up
      const bet = TABLE_BETS.includes(+m.bet) ? +m.bet : 0; if (!bet) return { ok: false, msg: "Pick a bet first." };
      if (now - (await this.timer(uid, "bj")) < 1200) return { ok: false, msg: "Shuffling..." };
      await this.setTimer(uid, "bj", now);
      const tk = await this.debit(uid, bet, "blackjack bet"); if (tk === null) return { ok: false, msg: `You need ${bet} TOKEN${bet > 1 ? "S" : ""} for that bet.` };
      const deck = [...Array(104).keys()].map((i) => i % 52); for (let k = deck.length - 1; k > 0; k--) { const j = rnd(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; }
      h = { bet, deck, p: [deck.pop(), deck.pop()], d: [deck.pop(), deck.pop()] };
      const pbj = handTotal(h.p) === 21, dbj = handTotal(h.d) === 21;
      if (pbj || dbj) return finish(h, pbj && dbj ? "push" : pbj ? "bj" : "lose");
      await this.ctx.storage.put(key, h); return view(h, { tk });
    }
    if (!h) return { ok: false, msg: "Place a bet and deal first." };
    if (cmd === "hit") { h.p.push(h.deck.pop()); const t = handTotal(h.p);
      if (t > 21) return finish(h, "bust"); if (t === 21) return dealerPlays(h); await this.ctx.storage.put(key, h); return view(h); }
    if (cmd === "stand") return dealerPlays(h);
    if (cmd === "double") {
      if (h.p.length !== 2) return { ok: false, msg: "You can only double on your first two cards." };
      const tk = await this.debit(uid, h.bet, "blackjack double"); if (tk === null) return { ok: false, msg: "Not enough TOKENS to double." };
      h.bet *= 2; h.p.push(h.deck.pop()); if (handTotal(h.p) > 21) return finish(h, "bust"); return dealerPlays(h);
    }
    return { ok: false };
  }

  // ---------- table games: the server deals, rolls and settles every bet ----------
  seatedAt(i) {
    const T = TABLES[i], out = [];
    for (const w of this.sockets()) { const a = w.deserializeAttachment(); if (!a) continue;
      if (this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.abs(x - T.gx) + Math.abs(y - T.gy) === 1)) out.push({ w, a }); }
    return out;
  }
  async tableStart(ws, a, m) {
    const i = m.i === 1 ? 1 : 0, g = m.g === "card" ? "card" : "roll";
    if (!this.seatedAt(i).some((s) => s.a.peer === a.peer)) return { ok: false, msg: "Sit at the table first!" };
    if (this.tables[i]) return { ok: false, msg: "A game is already going at this table." };
    this.tables[i] = { g, host: a.name };
    this.broadcast({ t: "tg", i, ph: "join", g, left: 8, host: a.name });
    setTimeout(() => this.tableResolve(i).catch((e) => console.error(e)), 8000);
    return { ok: true };
  }
  async tableResolve(i) {
    const st = this.tables[i]; if (!st) return;
    const seated = this.seatedAt(i);
    if (!seated.length) { this.tables[i] = null; this.broadcast({ t: "tg", i, ph: "cancel" }); return; }
    const n = seated.length + 1; let vals;
    if (st.g === "card") { const deck = [...Array(52).keys()]; for (let k = deck.length - 1; k > 0; k--) { const j = rnd(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; } vals = deck.slice(0, n); }
    else vals = Array.from({ length: n }, () => 1 + rnd(6));
    const house = vals[n - 1];
    const r = seated.map((s, k) => ({ p: s.a.peer, n: s.a.name, v: vals[k] })); r.push({ p: "house", n: "THE HOUSE", v: house });
    let w = 0; r.forEach((x, k) => { if (x.v > r[w].v) w = k; });
    this.broadcast({ t: "tg", i, ph: "res", g: st.g, r, w });
    // settle each player's own bet against the house
    const seen = new Set();
    for (const [k, s] of seated.entries()) {
      if (seen.has(s.a.uid)) continue; seen.add(s.a.uid);
      const u = await this.user(s.a.uid); const bet = Math.min(u.bet, u.tk); const v = vals[k];
      let tk = u.tk, note;
      if (!bet) note = v > house ? "You beat the house! (free game)" : v === house ? "You tied the house." : "The house wins this one.";
      else if (v > house) { tk = await this.credit(u.id, bet, "table win"); note = `You beat the house! +${bet} TOKENS`; }
      else if (v === house) note = "You tied the house. Your bet is returned.";
      else { const t2 = await this.debit(u.id, bet, "table loss"); if (t2 !== null) tk = t2; note = `The house wins. You lost ${bet} TOKEN${bet > 1 ? "S" : ""}.`; }
      for (const w2 of this.sockets()) { const a2 = w2.deserializeAttachment(); if (a2 && a2.uid === u.id) this.send(w2, { t: "tk", tk, msg: note }); }
    }
    setTimeout(() => { this.tables[i] = null; }, 4000);
  }

  // ---------- hunger and thirst ----------
  async needsTable() { if (this.needsReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS needs (uid INTEGER PRIMARY KEY, hu REAL NOT NULL DEFAULT 100, th REAL NOT NULL DEFAULT 100)").run(); this.needsReady = true; }
  async needsLoad(uid) { await this.needsTable(); const r = await this.env.DB.prepare("SELECT hu, th FROM needs WHERE uid = ?").bind(uid).first();
    const now = Date.now(); return { hu: r ? r.hu : 100, th: r ? r.th : 100, t: now, saved: now, sent: now, apple: 0 }; }   // time away doesn't count
  needsDrain(a, now) { const N = a.nd, dt = Math.max(0, Math.min(NEEDS.maxStep, now - N.t)); N.hu = Math.max(0, N.hu - dt * 100 / NEEDS.hungerMs); N.th = Math.max(0, N.th - dt * 100 / NEEDS.thirstMs); N.t = now; }
  async needsSave(a) { await this.needsTable(); await this.env.DB.prepare("INSERT INTO needs (uid, hu, th) VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET hu = excluded.hu, th = excluded.th").bind(a.uid, Math.round(a.nd.hu * 10) / 10, Math.round(a.nd.th * 10) / 10).run(); a.nd.saved = Date.now(); }
  needsOut(a) { return { hu: Math.round(a.nd.hu * 10) / 10, th: Math.round(a.nd.th * 10) / 10 }; }
  async needsTick(ws, a, now) {
    const was = a.nd.hu > 0 && a.nd.th > 0; this.needsDrain(a, now);
    const saved = now - a.nd.saved > NEEDS.saveMs; if (saved) await this.needsSave(a);
    const told = now - a.nd.sent > 30000 || was !== (a.nd.hu > 0 && a.nd.th > 0); if (told) { a.nd.sent = now; this.send(ws, { t: "nd", ...this.needsOut(a) }); }
    if (saved || told) ws.serializeAttachment(a);   // otherwise the caller stores it (movement does on every step); draining again from the old time gives the same numbers
  }
  async needsEat(ws, a, f, now) { if (!a.nd) return; this.needsDrain(a, now);
    a.nd.hu = Math.max(0, Math.min(100, a.nd.hu + (f.hu || 0))); a.nd.th = Math.max(0, Math.min(100, a.nd.th + (f.th || 0)));
    await this.needsSave(a); a.nd.sent = now; ws.serializeAttachment(a); }

  // ---------- spit arena ----------
  async arenaTable() {
    if (this.arenaReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS arena (uid INTEGER PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0, wk TEXT NOT NULL DEFAULT '', wk_best INTEGER NOT NULL DEFAULT 0, played INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, last_day TEXT NOT NULL DEFAULT '', earn_day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0, color TEXT NOT NULL DEFAULT 'blue')").run();
    this.arenaReady = true;
  }
  async arenaRow(uid) { await this.arenaTable(); return (await this.env.DB.prepare("SELECT * FROM arena WHERE uid = ?").bind(uid).first()) || { uid, xp: 0, best: 0, wk: "", wk_best: 0, played: 0, wins: 0, streak: 0, last_day: "", earn_day: "", earned: 0, color: "blue" }; }
  async arenaBoard(now) {
    await this.arenaTable(); const wk = etWeek(now);
    const q = async (sql, ...b) => ((await this.env.DB.prepare(sql).bind(...b).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { week: await q("SELECT u.name, a.wk_best AS s FROM arena a JOIN users u ON u.id = a.uid WHERE a.wk = ? AND a.wk_best > 0 AND u.banned = 0 ORDER BY a.wk_best DESC LIMIT 10", wk),
             all: await q("SELECT u.name, a.best AS s FROM arena a JOIN users u ON u.id = a.uid WHERE a.best > 0 AND u.banned = 0 ORDER BY a.best DESC LIMIT 5") };
  }
  arenaMe(r, now) {
    const lvl = arenaLevel(r.xp), today = etDay(now), yest = etDay(now - 86400000);
    const streak = r.last_day === today || r.last_day === yest ? r.streak : 0;
    return { xp: r.xp, lvl, lo: (lvl - 1) ** 2 * 100, hi: lvl ** 2 * 100, best: r.best, wkBest: r.wk === etWeek(now) ? r.wk_best : 0, played: r.played, wins: r.wins,
             streak, playedToday: r.last_day === today, earnedToday: r.earn_day === today ? r.earned : 0, cap: ARENA.dayCap, colors: unlocked(lvl), color: unlocked(lvl).includes(r.color) ? r.color : "blue",
             next: ARENA.colors.find(([, l]) => l > lvl) || null };
  }
  arenaMatchInfo(now) { const M = this.arenaM; if (!M || now > M.t0 + M.dur + 3000) return null;
    return { id: M.id, seed: M.seed, t0: M.t0, dur: M.dur, now, players: [...M.players.values()].map((p) => ({ n: p.n, c: p.c, sc: p.sc, peer: p.peer, done: p.done })) }; }
  arenaRoomBroadcast(obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "arena") { try { w.send(s); } catch (e) {} } } }
  async arenaInfo(a, now) {
    const r = await this.arenaRow(a.uid);
    return { ok: true, me: this.arenaMe(r, now), board: await this.arenaBoard(now), match: this.arenaMatchInfo(now) };
  }
  async arenaJoin(ws, a, m, now) {
    if (!a.pres || a.pres.rm !== "arena") return { ok: false, msg: "Head to the SPIT ARENA to play." };
    const r = await this.arenaRow(a.uid), me = this.arenaMe(r, now);
    const color = me.colors.includes(m.color) ? m.color : me.color;
    if (color !== r.color) await this.env.DB.prepare("INSERT INTO arena (uid, color) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET color = excluded.color").bind(a.uid, color).run();
    let M = this.arenaM;
    if (!M || now > M.t0 + M.dur - ARENA.lateJoin) {   // start a fresh round with a short countdown
      M = this.arenaM = { id: crypto.randomUUID().slice(0, 8), seed: (Math.random() * 2 ** 31) >>> 0, t0: now + ARENA.countdown, dur: ARENA.dur, players: new Map(), lastCast: 0 };
      this.arenaMs = this.arenaMs || new Map(); this.arenaMs.set(M.id, M);
      for (const [id, old] of this.arenaMs) if (now > old.t0 + old.dur + 120000) this.arenaMs.delete(id);   // forget rounds that ended two minutes ago
    }
    M.players.set(a.uid, { n: a.name, c: (a.pres && a.pres.c) || "twotone", peer: a.peer, sc: 0, color, done: false, joined: Math.max(now, M.t0) });
    a.arm = M.id; a.arc = color; ws.serializeAttachment(a);
    const info = this.arenaMatchInfo(now);
    this.arenaRoomBroadcast({ t: "am", match: info });
    return { ok: true, match: info, me, color };
  }
  // live moves: only between players in the same round. The server stamps who sent it.
  arenaRelay(ws, a, m, now) {
    const M = this.arenaMs && this.arenaMs.get(a.arm); if (!M || now > M.t0 + M.dur + 2000) return;
    const P = M.players.get(a.uid); if (!P) return;
    const raw = JSON.stringify(m); if (raw.length > 900) return;
    // the running score is kept for the wall scoreboard and for placing; it can only go up and never faster than the game allows
    if (Number.isFinite(+m.sc)) { const cap = Math.max(0, (now - P.joined) / 1000) * ARENA.maxRate + 10; P.sc = Math.max(P.sc, Math.min(cap, Math.floor(+m.sc))); }
    const out = JSON.stringify({ ...m, t: "ar", from: a.peer, n: a.name, c: P.c, col: P.color, sc: P.sc });   // server-stamped fields last so nobody can pretend to be someone else
    for (const w of this.sockets()) { if (w === ws) continue; const x = w.deserializeAttachment(); if (x && x.arm === M.id) { try { w.send(out); } catch (e) {} } }
    if (now - M.lastCast > 1500 && M === this.arenaM) { M.lastCast = now; this.arenaRoomBroadcast({ t: "am", match: this.arenaMatchInfo(now) }); }
  }
  async arenaEnd(ws, a, m, now) {
    const M = this.arenaMs && this.arenaMs.get(String(m.mid)); if (!M) return { ok: false, msg: "That round already ended." };
    const P = M.players.get(a.uid); if (!P) return { ok: false, msg: "You weren't in that round." };
    if (P.done) return { ok: false, msg: "Already counted." };
    if (now < M.t0 + M.dur - 2500) return { ok: false, msg: "The round isn't over yet." };
    P.done = true; if (a.arm === M.id) { a.arm = null; ws.serializeAttachment(a); }
    const secs = Math.max(0, (M.t0 + M.dur - P.joined) / 1000);
    const score = Math.max(0, Math.min(Math.floor(+m.score || 0), Math.floor(secs * ARENA.maxRate)));
    P.sc = Math.max(P.sc, score);
    const humans = [...M.players.values()]; const place = 1 + humans.filter((q) => q !== P && q.sc > score).length;
    const r = await this.arenaRow(a.uid), today = etDay(now), yest = etDay(now - 86400000), wk = etWeek(now);
    // daily streak: the first round each day keeps it going (or starts it again)
    const firstToday = r.last_day !== today; const streak = firstToday ? (r.last_day === yest ? r.streak + 1 : 1) : r.streak;
    let earn = Math.min(6, Math.floor(score / 25));
    const bonus = { streak: firstToday ? Math.min(5, streak) : 0, place: humans.length > 1 ? (place === 1 ? 3 : place === 2 ? 1 : 0) : 0 };
    earn += bonus.streak + bonus.place; earn = halfIfEmpty(a, earn);
    const earnedSoFar = r.earn_day === today ? r.earned : 0; earn = Math.max(0, Math.min(earn, ARENA.dayCap - earnedSoFar));
    const xp = r.xp + score + 20 + (humans.length > 1 && place === 1 ? 30 : 0);
    const best = score > r.best, wkBest = r.wk !== wk ? score : Math.max(r.wk_best, score), newWk = r.wk !== wk || score > r.wk_best;
    const win = humans.length > 1 && place === 1 ? 1 : 0;
    await this.env.DB.prepare(`INSERT INTO arena (uid, xp, best, wk, wk_best, played, wins, streak, last_day, earn_day, earned, color) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET xp = excluded.xp, best = MAX(best, excluded.best), wk = excluded.wk, wk_best = excluded.wk_best, played = played + 1, wins = wins + excluded.wins, streak = excluded.streak, last_day = excluded.last_day, earn_day = excluded.earn_day, earned = excluded.earned`)
      .bind(a.uid, xp, score, wk, wkBest, win, streak, today, today, earnedSoFar + earn, r.color || "blue").run();
    const tk = earn ? await this.credit(a.uid, earn, "spit arena") : (await this.user(a.uid)).tk;
    const before = arenaLevel(r.xp), after = arenaLevel(xp);
    const me = this.arenaMe({ ...r, xp, best: Math.max(r.best, score), wk, wk_best: wkBest, streak, last_day: today, earn_day: today, earned: earnedSoFar + earn }, now);
    const board = await this.arenaBoard(now);
    if (best || newWk) this.arenaRoomBroadcast({ t: "ab", board });
    return { ok: true, score, place, players: humans.length, earned: earn, bonus, capped: earnedSoFar + earn >= ARENA.dayCap, best, wkBest: newWk && score > 0, levelUp: after > before ? after : 0,
             newColors: unlocked(after).filter((c) => !unlocked(before).includes(c)), me, board, tk };
  }


  // ---------- boxing ----------
  async boxTable() { if (this.boxReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS boxing (uid INTEGER PRIMARY KEY, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, draws INTEGER NOT NULL DEFAULT 0, kos INTEGER NOT NULL DEFAULT 0, earn_day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0)").run(); this.boxReady = true; }
  async boxRow(uid) { await this.boxTable(); return (await this.env.DB.prepare("SELECT * FROM boxing WHERE uid = ?").bind(uid).first()) || { uid, wins: 0, losses: 0, draws: 0, kos: 0, earn_day: "", earned: 0 }; }
  sockFor(uid) { for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === uid) return [w, x]; } return [null, null]; }
  inGym(uid) { const [, x] = this.sockFor(uid); return !!(x && x.pres && x.pres.rm === "gym"); }
  gymBroadcast(obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "gym") { try { w.send(s); } catch (e) {} } } }
  // TWO RINGS: this.bxs[0] and this.bxs[1] each hold one fight (or null). Every "bx" message says which ring it is about (r).
  rings() { return this.bxs || (this.bxs = [null, null]); }
  boxingOf(uid) { return this.rings().find((M) => M && M.phase !== "over" && (M.a.uid === uid || (!M.b.bot && M.b.uid === uid))) || null; }
  boxPublic(M) { if (!M) return null; const f = (P) => ({ n: P.name, bot: P.bot || null, hp: P.hp, st: P.st });
    return { id: M.id, ring: M.ring, a: f(M.a), b: f(M.b), round: M.round, beat: M.beat, beats: BOX.beats, rounds: BOX.rounds, phase: M.phase, next: M.next, ms: BOX.beat }; }
  async boxInfo(a, now) { const r = await this.boxRow(a.uid), today = etDay(now);
    const rings = this.rings().map((M) => this.boxPublic(M));
    this.bxQ = this.bxQueue().filter((q) => this.inGym(q.uid) && (!q.vs || this.inGym(q.vs.uid)));
    return { ok: true, s: rings[0], rings, queue: this.bxQPublic(), me: { wins: r.wins, losses: r.losses, draws: r.draws, kos: r.kos, earned: r.earn_day === today ? r.earned : 0, cap: BOX.dayCap }, bots: BOX_BOTS, pay: BOX.pay }; }
  // NEXT UP: when both rings are busy, fights wait in line (one entry per llama) and start as rings free up
  bxQueue() { return this.bxQ || (this.bxQ = []); }
  bxQPublic() { return this.bxQueue().map((q) => ({ a: q.name, b: q.vs ? q.vs.name : BOX_BOTS[q.bot].n })); }
  bxQHas(uid) { return this.bxQueue().some((q) => q.uid === uid || (q.vs && q.vs.uid === uid)); }
  bxQDrop(uid) { const Q = this.bxQueue(), n = Q.length; this.bxQ = Q.filter((q) => q.uid !== uid && !(q.vs && q.vs.uid === uid)); return this.bxQ.length !== n; }
  bxQCast() { this.gymBroadcast({ t: "bxq", q: this.bxQPublic() }); }
  bxQAdd(q) { const Q = this.bxQueue(); if (Q.length >= 8) return 0; Q.push(q); this.bxQCast(); return Q.length; }
  bxQPump(now) { const Q = this.bxQueue(); if (!Q.length) return; let ring;
    this.bxQ = Q.filter((q) => this.inGym(q.uid) && (!q.vs || this.inGym(q.vs.uid)));   // anyone who walked out loses their place
    while (this.bxQ.length && (ring = this.boxFree()) >= 0) { const q = this.bxQ.shift(); if (this.boxingOf(q.uid) || (q.vs && this.boxingOf(q.vs.uid))) continue;
      this.boxStart({ uid: q.uid, name: q.name }, q.vs ? { uid: q.vs.uid, name: q.vs.name } : { bot: q.bot, name: BOX_BOTS[q.bot].n }, now, ring); }
    this.bxQCast(); }
  boxLeave(a) { const ch = this.bxQDrop(a.uid); if (ch) this.bxQCast(); return { ok: true, left: ch }; }
  // the first ring with nothing going on, or -1 when both are busy
  boxFree() { const R = this.rings(); for (let i = 0; i < R.length; i++) { if (R[i] && R[i].phase === "over" && Date.now() - R[i].ended > 3500) R[i] = null; if (!R[i]) return i; } return -1; }
  boxStart(A, B, now, ring) {
    const id = String(now), mk = (P) => ({ uid: P.uid || 0, name: P.name, bot: P.bot || null, hp: BOX.hp, st: BOX.st, mv: null, hist: [] });
    const M = this.rings()[ring] = { id, ring, a: mk(A), b: mk(B), round: 1, beat: 0, phase: "start", next: now + BOX.start, t0: now, beatsDone: 0 };
    this.gymBroadcast({ t: "bx", r: ring, s: this.boxPublic(M), ev: "start" });
    setTimeout(() => this.boxTick(M).catch((e) => console.error("box", e)), BOX.start);
  }
  async boxBot(ws, a, m, now) {
    if (!a.pres || a.pres.rm !== "gym") return { ok: false, msg: "Head to the BOXING GYM to box." };
    const k = String(m.bot || ""); if (!BOX_BOTS[k]) return { ok: false, msg: "Pick a sparring partner." };
    if (this.boxingOf(a.uid)) return { ok: false, msg: "You're already in a fight." };
    if (this.bxQHas(a.uid)) return { ok: false, msg: "You're already in line. You'll be called when a ring is free." };
    const ring = this.boxFree(); if (ring < 0) { const pos = this.bxQAdd({ uid: a.uid, name: a.name, bot: k }); return pos ? { ok: true, queued: pos, msg: `Both rings are busy. You're number ${pos} in line!` } : { ok: false, msg: "Both rings are busy and the line is full. Try again soon." }; }
    this.boxStart({ uid: a.uid, name: a.name }, { bot: k, name: BOX_BOTS[k].n }, now, ring); return { ok: true };
  }
  async boxInvite(ws, a, m, now) {
    if (!a.pres || a.pres.rm !== "gym") return { ok: false, msg: "Head to the BOXING GYM to box." };
    const n = String(m.n || "").toUpperCase().slice(0, 24); const them = [...this.sockets()].map((w) => [w, w.deserializeAttachment()]).find(([, x]) => x && x.name === n && x.pres && x.pres.rm === "gym");
    if (!them) return { ok: false, msg: `${n || "They"} isn't in the gym right now.` };
    const [tw, tx] = them; if (tx.uid === a.uid) return { ok: false, msg: "You can't box yourself." };
    if (await this.blockedPair(a.uid, tx.uid)) return { ok: false, msg: `You can't challenge ${n}.` };
    if (this.boxingOf(a.uid)) return { ok: false, msg: "You're already in a fight." };
    if (this.boxingOf(tx.uid)) return { ok: false, msg: `${n} is in a fight right now.` };
    if (this.bxQHas(a.uid) || this.bxQHas(tx.uid)) return { ok: false, msg: "One of you is already in line for a fight." };
    (this.bxInv = this.bxInv || new Map()).set(tx.uid, { from: a.uid, name: a.name, t: now });
    this.send(tw, { t: "bxinv", from: a.name, ms: BOX.inviteMs }); return { ok: true, msg: `Challenge sent to ${n}!` };
  }
  async boxAnswer(ws, a, m, now) {
    const inv = this.bxInv && this.bxInv.get(a.uid); if (inv) this.bxInv.delete(a.uid);
    if (!inv || now - inv.t > BOX.inviteMs) return { ok: false, msg: "That challenge ran out." };
    const [fw] = this.sockFor(inv.from);
    if (!m.yes) { if (fw) this.send(fw, { t: "toast", msg: `${a.name} turned down your challenge.` }); return { ok: true }; }
    if (!a.pres || a.pres.rm !== "gym" || !this.inGym(inv.from)) return { ok: false, msg: "You both need to be in the gym." };
    if (this.boxingOf(a.uid) || this.boxingOf(inv.from)) return { ok: false, msg: "One of you is already in a fight." };
    const ring = this.boxFree(); if (ring < 0) { const pos = this.bxQAdd({ uid: inv.from, name: inv.name, vs: { uid: a.uid, name: a.name } }); const msg = pos ? `Both rings are busy. Your fight is number ${pos} in line!` : "Both rings are busy and the line is full. Try again soon."; if (fw) this.send(fw, { t: "toast", msg }); return { ok: !!pos, queued: pos, msg }; }
    this.boxStart({ uid: inv.from, name: inv.name }, { uid: a.uid, name: a.name }, now, ring); return { ok: true };
  }
  boxMove(a, m) { const M = this.boxingOf(a.uid); if (!M || M.phase !== "fight") return { ok: false };
    const P = M.a.uid === a.uid ? M.a : M.b.uid === a.uid && !M.b.bot ? M.b : null; if (!P) return { ok: false };
    const mv = String(m.mv || ""); if (!BOX_MOVES.has(mv)) return { ok: false }; P.mv = mv; return { ok: true, mv }; }
  boxQuit(a) { const M = this.boxingOf(a.uid); if (!M || M.phase === "over") return { ok: false }; const P = M.a.uid === a.uid ? M.a : M.b.uid === a.uid ? M.b : null; if (!P) return { ok: false };
    P.quit = true; return { ok: true }; }
  boxBotMove(P, O) {   // the bot's move: the champ watches what you've been throwing and counters it; both rest when tired
    const B = BOX_BOTS[P.bot], r = Math.random(); if (r < B.idle) return null;
    if (P.st < 12) return Math.random() < 0.7 ? "block" : null;
    if (B.smart && O.hist.length && Math.random() < B.smart) { const cnt = {}; for (const h of O.hist.slice(-4)) if (h) cnt[h] = (cnt[h] || 0) + 1; const top = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0]; if (top) return BOX_COUNTER[top]; }
    const pool = ["jab", "jab", "hook", "block", "dodge"]; return pool[Math.floor(Math.random() * pool.length)];
  }
  async boxTick(M) {
    if (this.rings()[M.ring] !== M || M.phase === "over") return;
    const now = Date.now();
    // someone walked out or dropped: the other fighter wins
    for (const [P, O] of [[M.a, M.b], [M.b, M.a]]) if (!P.bot && (P.quit || !this.inGym(P.uid))) return this.boxEnd(M, O, P, "forfeit");
    if (M.phase === "start" || M.phase === "rest") { M.phase = "fight"; M.beat = 0; M.next = now + BOX.beat; this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "bell" }); setTimeout(() => this.boxTick(M).catch((e) => console.error("box", e)), BOX.beat); return; }
    // settle this beat
    for (const [P, O] of [[M.a, M.b], [M.b, M.a]]) if (P.bot) P.mv = this.boxBotMove(P, O);
    const out = {};
    for (const [P, O, k] of [[M.a, M.b, "a"], [M.b, M.a, "b"]]) { const mv = P.mv || "idle", cost = BOX_COST[mv]; P.tired = cost > 0 && P.st < cost; P.st = Math.max(0, Math.min(BOX.st, P.st - cost + 3)); out[k] = { mv, tired: P.tired }; }
    for (const [P, O, k, ok] of [[M.a, M.b, "a", "b"], [M.b, M.a, "b", "a"]]) { let d = boxHit(P.mv || "idle", O.mv || "idle"); if (d && P.tired) d = Math.floor(d / 2); if (d) d = Math.max(1, d + Math.floor(Math.random() * 3) - 1); O.hp = Math.max(0, O.hp - d); out[ok].took = d; }
    for (const P of [M.a, M.b]) { P.hist.push(P.mv); if (P.hist.length > 8) P.hist.shift(); P.mv = null; }
    M.beat++; M.beatsDone++;
    const ko = M.a.hp <= 0 || M.b.hp <= 0;
    if (ko) { M.phase = "over"; this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "beat", out });
      const win = M.a.hp > M.b.hp ? M.a : M.b.hp > M.a.hp ? M.b : null; return this.boxEnd(M, win, win === M.a ? M.b : win === M.b ? M.a : null, "ko"); }
    if (M.beat >= BOX.beats) {
      if (M.round >= BOX.rounds) { M.phase = "over"; this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "beat", out });
        const win = M.a.hp > M.b.hp ? M.a : M.b.hp > M.a.hp ? M.b : null; return this.boxEnd(M, win, win === M.a ? M.b : win === M.b ? M.a : null, "points"); }
      M.round++; M.phase = "rest"; M.next = now + BOX.rest; for (const P of [M.a, M.b]) P.st = Math.min(BOX.st, P.st + 25);
      this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "beat", out }); setTimeout(() => this.boxTick(M).catch((e) => console.error("box", e)), BOX.rest); return; }
    M.next = now + BOX.beat; this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "beat", out });
    setTimeout(() => this.boxTick(M).catch((e) => console.error("box", e)), BOX.beat);
  }
  async boxEnd(M, win, lose, how) {
    M.phase = "over"; M.ended = Date.now(); const now = M.ended, today = etDay(now);
    const pvp = !M.a.bot && !M.b.bot, real = M.beatsDone >= BOX.minBeats;
    let pairNote = "";
    if (pvp && real) { const key = [M.a.uid, M.b.uid].sort((x, y) => x - y).join(":") + ":" + today; this.bxPair = this.bxPair || new Map(); const n = (this.bxPair.get(key) || 0) + 1; this.bxPair.set(key, n); if (n > BOX.pairPerDay) pairNote = "practice"; }
    const pays = {};
    for (const P of [M.a, M.b]) { if (P.bot) continue;
      const won = win === P, lost = lose === P, drew = !win;
      let earn = 0;
      if (pvp) { if (real && !pairNote) earn = won ? BOX.pay.win : drew ? BOX.pay.draw : BOX.pay.lose; }
      else if (won) earn = BOX.pay[(M.a.bot || M.b.bot)] || 0;
      const r = await this.boxRow(P.uid); const so = r.earn_day === today ? r.earned : 0; const [ws, att] = this.sockFor(P.uid);
      earn = Math.max(0, Math.min(halfIfEmpty(att, earn), BOX.dayCap - so));
      await this.env.DB.prepare(`INSERT INTO boxing (uid, wins, losses, draws, kos, earn_day, earned) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET wins = wins + excluded.wins, losses = losses + excluded.losses, draws = draws + excluded.draws, kos = kos + excluded.kos, earn_day = excluded.earn_day, earned = excluded.earned`)
        .bind(P.uid, won ? 1 : 0, lost ? 1 : 0, drew ? 1 : 0, won && how === "ko" ? 1 : 0, today, so + earn).run();
      const tk = earn ? await this.credit(P.uid, earn, "boxing") : null; pays[P.name] = earn; if (ws) this.send(ws, { t: "bxpay", earned: earn, tk, capped: so + earn >= BOX.dayCap, practice: !!pairNote || (pvp && !real) });
    }
    this.gymBroadcast({ t: "bx", r: M.ring, s: this.boxPublic(M), ev: "end", win: win ? win.name : null, how, pays });
    setTimeout(() => { if (this.rings()[M.ring] === M) { this.rings()[M.ring] = null; this.gymBroadcast({ t: "bx", r: M.ring, s: null, ev: "clear" }); } try { this.bxQPump(Date.now()); } catch (e) { console.error("bxq", e); } }, 4000);
  }

  // ---------- treasure cove ----------
  // both treasure rooms run the same way; each has its own island or clearing, finds and dig-only rare
  huntOf(rm) { return rm === "cove" ? HUNTS.cove : rm === "jungle" ? HUNTS.jungle : null; }
  coveInit(now, rm = "cove") { this.hunts = this.hunts || {}; if (this.hunts[rm]) return this.hunts[rm]; const C = this.hunts[rm] = { rm, H: this.huntOf(rm), t: new Map(), holes: new Map(), last: new Map(), scan: new Map() }; for (let i = 0; i < COVE.n; i++) this.coveBury(now, C); return C; }
  coveBury(now, C) { for (let tries = 0; tries < 200; tries++) { const x = Math.floor(Math.random() * COVE.w), y = Math.floor(Math.random() * COVE.h), k = x + "," + y;
      if (!C.H.dig(x, y) || C.t.has(k) || C.holes.has(k)) continue; let r = Math.random(), kind = "coins"; for (const [kk, , p] of C.H.finds) { if (r < p) { kind = kk; break; } r -= p; } C.t.set(k, kind); return; } }
  coveHoles(now, C) { const out = []; for (const [k, v] of C.holes) { if (now - v.t > COVE.holeMs) C.holes.delete(k); else out.push([...k.split(",").map(Number), v.f ? 1 : 0]); } return out; }
  async coveInfo(a, now) { const rm = a.pres && this.huntOf(a.pres.rm) ? a.pres.rm : "cove"; const C = this.coveInit(now, rm); const r = await this.dailyCove(a.uid, now, rm); return { ok: true, holes: this.coveHoles(now, C), earned: r.earned, cap: COVE.dayCap, buried: C.t.size }; }
  async dailyCove(uid, now, rm = "cove") { const T = HUNTS[rm].table; await this.env.DB.prepare(`CREATE TABLE IF NOT EXISTS ${T} (uid INTEGER PRIMARY KEY, day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0, chests INTEGER NOT NULL DEFAULT 0, finds INTEGER NOT NULL DEFAULT 0)`).run();
    const r = await this.env.DB.prepare(`SELECT * FROM ${T} WHERE uid = ?`).bind(uid).first(), today = etDay(now);
    return r && r.day === today ? r : { uid, day: today, earned: 0, chests: 0, finds: r ? r.finds : 0 }; }
  covePos(a) { const p = a.pres; if (!p || !this.huntOf(p.rm) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null; return [Math.floor(p.x), Math.floor(p.y)]; }
  coveScan(a, now) { const pos = this.covePos(a); if (!pos) return { ok: false, msg: "Head to TREASURE COVE or the JUNGLE TEMPLE to hunt." }; const C = this.coveInit(now, a.pres.rm);
    if (now - (C.scan.get(a.uid) || 0) < COVE.scanGap) return { ok: false, slow: true }; C.scan.set(a.uid, now);
    let best = 99; for (const k of C.t.keys()) { const [x, y] = k.split(",").map(Number); best = Math.min(best, Math.max(Math.abs(x - pos[0]), Math.abs(y - pos[1]))); }
    const heat = best === 0 ? 4 : best <= 1 ? 3 : best <= 3 ? 2 : best <= 6 ? 1 : 0; return { ok: true, heat }; }
  async coveDig(ws, a, m, now) {
    const pos = this.covePos(a); if (!pos) return { ok: false, msg: "Head to TREASURE COVE or the JUNGLE TEMPLE to hunt." }; const C = this.coveInit(now, a.pres.rm), H = C.H;
    const x = Math.floor(+m.x), y = Math.floor(+m.y); if (!Number.isFinite(x) || !Number.isFinite(y) || Math.max(Math.abs(x - pos[0]), Math.abs(y - pos[1])) > 1) return { ok: false, msg: "Dig right next to where you're standing." };
    if (!H.dig(x, y)) return { ok: false, msg: "You can't dig there." };
    if (now - (C.last.get(a.uid) || 0) < COVE.digGap) return { ok: false, msg: "Catch your breath first." }; C.last.set(a.uid, now);
    const k = x + "," + y; if (C.holes.has(k) && now - C.holes.get(k).t <= COVE.holeMs) return { ok: false, msg: "Someone already dug here." };
    const kind = C.t.get(k); const ev = { t: "cv", n: a.name, x, y };
    if (!kind) { C.holes.set(k, { t: now, f: 0 }); const junk = Math.random() < 0.3 ? COVE.junk[Math.floor(Math.random() * COVE.junk.length)] : null; ev.f = 0; ev.junk = junk; this.coveBroadcast(ev, C.rm); return { ok: true, found: null, junk }; }
    C.t.delete(k); C.holes.set(k, { t: now, f: 1 }); setTimeout(() => this.coveBury(Date.now(), C), COVE.respawn);
    const r = await this.dailyCove(a.uid, now, C.rm); let find = kind, pay = (H.finds.find((q) => q[0] === kind) || [0, 3])[1], item = null;
    if (find === H.rareFind) { if (r.chests >= COVE.chestPerDay) { find = "gold"; pay = 6; } else { item = H.rare; await this.prTables(); await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, item).run(); } }
    pay = Math.max(0, Math.min(halfIfEmpty(a, pay), COVE.dayCap - r.earned));
    const evx = eventNow(now), bonus = evx && evx.kind === "x2" && evx.rm === C.rm ? pay : 0;   // double-treasure event: the extra is a bonus on top and doesn't use up today's max
    await this.env.DB.prepare(`INSERT INTO ${H.table} (uid, day, earned, chests, finds) VALUES (?, ?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET day = excluded.day, earned = excluded.earned, chests = excluded.chests, finds = excluded.finds`)
      .bind(a.uid, r.day, r.earned + pay, r.chests + (item ? 1 : 0), (r.finds || 0) + 1).run();
    let tk = pay ? await this.credit(a.uid, pay, "treasure") : null; if (bonus) tk = await this.credit(a.uid, bonus, "treasure event");
    ev.f = 1; ev.find = find; this.coveBroadcast(ev, C.rm);
    return { ok: true, found: find, pay: pay + bonus, x2: bonus > 0, item, tk, capped: r.earned + pay >= COVE.dayCap, furn: item ? await this.furnStorage(a.uid) : undefined };
  }
  coveBroadcast(obj, rm = "cove") { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === rm) { try { w.send(s); } catch (e) {} } } }

  // ---------- dunk tank ----------
  async dunkThrow(a, m, now) {
    const [tx, ty] = DUNK.target;
    if (!this.near(a, "barn", (x, y, p) => p.p !== "sit" && y + 0.5 > ty && Math.max(Math.abs(x + 0.5 - tx), Math.abs(y + 0.5 - ty)) <= 4.6)) return { ok: false, msg: "Step up to the throwing spot in front of the target." };
    if (now - (this.dunkLast && this.dunkLast.get(a.uid) || 0) < DUNK.gap) return { ok: false, msg: "Wait for the ball to land." };
    (this.dunkLast = this.dunkLast || new Map()).set(a.uid, now);
    let tk = await this.debit(a.uid, DUNK.cost, "dunk throw"); if (tk === null) return { ok: false, msg: "A throw costs 1 COIN. Harvest carrots or go fishing to earn some!" };
    const hit = !!m.hit, today = etDay(now);
    const key = "dunk:" + a.uid, D = (await this.ctx.storage.get(key)) || {}; if (D.day !== today) { D.day = today; D.won = 0; D.paid = 0; }
    let won = 0; if (hit) { won = Math.max(0, Math.min(DUNK.prize, DUNK.winCap - D.won)); D.won += won; if (won) tk = await this.credit(a.uid, won, "dunk tank"); }
    await this.ctx.storage.put(key, D);
    // pay the brave llama on the seat (not if it's you)
    let sitter = null;
    if (hit) for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.uid === a.uid) continue;
      const p = x.pres; if (p.rm !== "barn" || p.p !== "sit" || Math.floor(p.x) !== DUNK.seat[0] || Math.floor(p.y) !== DUNK.seat[1]) continue;
      sitter = x.name; const k2 = "dunk:" + x.uid, S2 = (await this.ctx.storage.get(k2)) || {}; if (S2.day !== today) { S2.day = today; S2.won = 0; S2.paid = 0; }
      const pay = Math.max(0, Math.min(DUNK.sitPay, DUNK.sitCap - S2.paid)); S2.paid += pay; await this.ctx.storage.put(k2, S2);
      if (pay) { const t2 = await this.credit(x.uid, pay, "dunked"); this.send(w, { t: "tk", tk: t2, msg: `SPLASH! ${a.name} dunked you. +${pay} COIN for being a good sport!` }); }
      break; }
    const ev = { t: "dk", by: a.name, peer: a.peer, hit, sitter };
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "barn") { try { w.send(JSON.stringify(ev)); } catch (e) {} } }
    return { ok: true, hit, won, capped: hit && !won, tk };
  }

  // ---------- hay bale bowling ----------
  async bowlTable() {
    if (this.bowlReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS bowl (uid INTEGER PRIMARY KEY, best INTEGER NOT NULL DEFAULT 0, wk TEXT NOT NULL DEFAULT '', wk_best INTEGER NOT NULL DEFAULT 0, games INTEGER NOT NULL DEFAULT 0, strikes INTEGER NOT NULL DEFAULT 0, last_day TEXT NOT NULL DEFAULT '', earn_day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0)").run();
    this.bowlReady = true;
  }
  async bowlRow(uid) { await this.bowlTable(); return (await this.env.DB.prepare("SELECT * FROM bowl WHERE uid = ?").bind(uid).first()) || { uid, best: 0, wk: "", wk_best: 0, games: 0, strikes: 0, last_day: "", earn_day: "", earned: 0 }; }
  async bowlBoard(now) {
    await this.bowlTable(); const wk = etWeek(now);
    const q = async (sql, ...b) => ((await this.env.DB.prepare(sql).bind(...b).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { week: await q("SELECT u.name, b.wk_best AS s FROM bowl b JOIN users u ON u.id = b.uid WHERE b.wk = ? AND b.wk_best > 0 AND u.banned = 0 ORDER BY b.wk_best DESC LIMIT 10", wk),
             all: await q("SELECT u.name, b.best AS s FROM bowl b JOIN users u ON u.id = b.uid WHERE b.best > 0 AND u.banned = 0 ORDER BY b.best DESC LIMIT 5") };
  }
  bowlMe(r, now) { const today = etDay(now);
    return { best: r.best, wkBest: r.wk === etWeek(now) ? r.wk_best : 0, games: r.games, strikes: r.strikes, playedToday: r.last_day === today, earnedToday: r.earn_day === today ? r.earned : 0, cap: LANES.dayCap }; }
  bowlLiveList(now) { const out = []; for (const [uid, L] of this.bowlLive || []) { if (now - L.at > 5 * 60000) { this.bowlLive.delete(uid); continue; } out.push({ n: L.n, c: L.c, sc: L.sc, f: L.f, lane: L.lane }); } return out; }
  bowlLiveDrop(uid) { if (this.bowlLive && this.bowlLive.delete(uid)) this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(Date.now()) }); }
  lanesBroadcast(obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "lanes") { try { w.send(s); } catch (e) {} } } }
  bowlLaneFor(uid) { this.bowlLive = this.bowlLive || new Map(); const cur = this.bowlLive.get(uid); if (cur) return cur.lane;
    const used = new Set([...this.bowlLive.values()].map((L) => L.lane)); for (let i = 0; i < 4; i++) if (!used.has(i)) return i; return uid % 4; }
  async bowlGame(uid, now) { const G = await this.ctx.storage.get("bowl:" + uid); if (!G || now - G.last > LANES.expire) return null; return G; }
  bowlView(G) { const st = bowlState(G.rolls); return { rolls: G.rolls, standing: G.standing, card: bowlScore(G.rolls), frame: st.frame, ball: st.ball, done: st.done, lane: G.lane }; }
  async bowlInfo(a, now) {
    const G = await this.bowlGame(a.uid, now);
    return { ok: true, me: this.bowlMe(await this.bowlRow(a.uid), now), board: await this.bowlBoard(now), live: this.bowlLiveList(now), game: G ? this.bowlView(G) : null };
  }
  async bowlStart(a, now) {
    if (!a.pres || a.pres.rm !== "lanes") return { ok: false, msg: "Head to LLAMA LANES to bowl." };
    const lane = this.bowlLaneFor(a.uid);
    const G = { rolls: [], standing: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], started: now, last: now - LANES.minGap, lane };
    await this.ctx.storage.put("bowl:" + a.uid, G);
    this.bowlLive.set(a.uid, { n: a.name, c: (a.pres && a.pres.c) || "twotone", sc: 0, f: 1, lane, at: now });
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now) });
    return { ok: true, game: this.bowlView(G) };
  }
  async bowlRoll(a, m, now) {
    const G = await this.bowlGame(a.uid, now); if (!G) return { ok: false, msg: "Start a new game first." };
    if (now - G.last < LANES.minGap) return { ok: false, msg: "Wait for the pins to settle." };
    const st0 = bowlState(G.rolls); if (st0.done) return { ok: false, msg: "That game is over." };
    const throwIn = bowlClamp(m);   // same limits as the page
    const res = bowlSim(throwIn, G.standing);
    const before = G.standing.slice(); const n = res.down.length;
    G.rolls.push(n); G.last = now;
    for (const i of res.down) G.standing[i] = 0;
    const st = bowlState(G.rolls);
    if (!st.done && (st.ball === 0 || st.fresh)) G.standing = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];   // pinsetter: fresh rack
    const card = bowlScore(G.rolls);
    // what to call it
    const firstBall = st0.ball === 0 || (st0.frame === BOWL_FRAMES - 1 && before.every((v) => v === 1));
    const prev = G.rolls.length > 1 ? G.rolls[G.rolls.length - 2] : null;
    let call = res.gutter ? "GUTTER" : n === 0 ? "MISS" : "";
    if (firstBall && n === 10) call = "STRIKE"; else if (!firstBall && before.filter(Boolean).length === n && n > 0) call = "SPARE";
    const streak = (() => { let k = 0; for (let i = G.rolls.length - 1; i >= 0 && G.rolls[i] === 10; i--) k++; return k; })();
    if (call === "STRIKE" && streak >= 3) call = streak === 3 ? "TURKEY" : streak + " IN A ROW";
    const L = this.bowlLive && this.bowlLive.get(a.uid); if (L) { L.sc = card.total; L.f = Math.min(BOWL_FRAMES, st.frame + 1); L.at = now; }
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now), ev: call && call !== "MISS" ? { n: a.name, call } : null });
    const out = { ok: true, throw: throwIn, before, down: res.down, n, gutter: res.gutter, call, card, rolls: G.rolls, standing: G.standing, frame: st.frame, ball: st.ball, done: st.done };
    if (!st.done) { await this.ctx.storage.put("bowl:" + a.uid, G); return out; }
    // game over: record it and pay coins
    await this.ctx.storage.delete("bowl:" + a.uid); this.bowlLiveDrop(a.uid);
    const total = card.total, strikes = G.rolls.filter((v, i) => v === 10).length;
    const r = await this.bowlRow(a.uid), today = etDay(now), wk = etWeek(now);
    const firstToday = r.last_day !== today;
    let turkeys = 0; { let k = 0; for (const v of G.rolls) { if (v === 10) { k++; if (k === 3) turkeys++; } else k = 0; } }
    // plausibility: a game can't be faster than its rolls allow
    const minMs = (G.rolls.length - 1) * LANES.minGap;
    let earn = now - G.started >= minMs ? Math.min(15, Math.floor(total / 10)) : 0;
    const bonus = { daily: firstToday ? 2 : 0, turkey: turkeys * 3, perfect: total === BOWL_FRAMES * 30 ? 10 : 0 };
    earn += bonus.daily + bonus.turkey + bonus.perfect; earn = halfIfEmpty(a, earn);
    const soFar = r.earn_day === today ? r.earned : 0; earn = Math.max(0, Math.min(earn, LANES.dayCap - soFar));
    const best = total > r.best, wkBest = r.wk !== wk ? total : Math.max(r.wk_best, total), newWk = r.wk !== wk || total > r.wk_best;
    await this.env.DB.prepare(`INSERT INTO bowl (uid, best, wk, wk_best, games, strikes, last_day, earn_day, earned) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET best = MAX(best, excluded.best), wk = excluded.wk, wk_best = excluded.wk_best, games = games + 1, strikes = strikes + excluded.strikes, last_day = excluded.last_day, earn_day = excluded.earn_day, earned = excluded.earned`)
      .bind(a.uid, total, wk, wkBest, strikes, today, today, soFar + earn).run();
    const tk = earn ? await this.credit(a.uid, earn, "bowling") : (await this.user(a.uid)).tk;
    const board = await this.bowlBoard(now);
    if (best || newWk) this.lanesBroadcast({ t: "bb", board });
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now), ev: { n: a.name, call: "FINAL " + total } });
    return { ...out, final: { total, strikes, earned: earn, bonus, capped: soFar + earn >= LANES.dayCap, best, wkBest: newWk && total > 0,
      me: this.bowlMe({ ...r, best: Math.max(r.best, total), wk, wk_best: wkBest, games: r.games + 1, strikes: r.strikes + strikes, last_day: today, earn_day: today, earned: soFar + earn }, now), board, tk } };
  }

  // ---------- staff tools: mods mute, unmute and kick; the owner can also ban, unban and make or remove mods ----------
  // staff can add tokens to a player. Mods: not to themselves, and at most STAFF_GIVE_DAY a day in total. The owner has no limit.
  // take back a token gift: the owner can undo any gift, a mod only their own. Takes back what the player still has (never below 0), once.
  async giftUndo(a, m) {
    const st = await this.staffNow(a); if (!st) return { ok: false, msg: "Only staff can do that." };
    const g = await this.env.DB.prepare("SELECT id, uid, delta, reason FROM ledger WHERE id = ? AND reason LIKE 'staff gift by %'").bind(Math.floor(+m.gid || 0)).first();
    if (!g) return { ok: false, msg: "That gift isn't in the records." };
    const by = g.reason.slice(14);
    if (st !== "owner" && by.toUpperCase() !== String(a.name).toUpperCase()) return { ok: false, msg: "Mods can only undo their own gifts." };
    if (await this.env.DB.prepare("SELECT id FROM ledger WHERE reason LIKE ?").bind("gift undone #" + g.id + " %").first()) return { ok: false, msg: "That gift was already undone." };
    const u = await this.user(g.uid); if (!u) return { ok: false, msg: "That player is gone." };
    const take = Math.max(0, Math.min(g.delta, u.tk));
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk - ? WHERE id = ? AND tk >= ? RETURNING tk").bind(take, u.id, take).first();
    if (!r) return { ok: false, msg: "Their balance changed. Try again." };
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(u.id, -take, "gift undone #" + g.id + " by " + a.name, Date.now()).run();
    for (const w2 of this.sockets()) { const x = w2.deserializeAttachment(); if (x && x.uid === u.id) { if (x.uc) { x.uc.tk = r.tk; w2.serializeAttachment(x); } this.send(w2, { t: "tk", tk: r.tk, msg: take ? `A staff token gift of ${take} was taken back.` : "" }); } }
    await this.logStaff(a.name, "undogift", `${u.name.toUpperCase()} ${take}`);
    return { ok: true, msg: take < g.delta ? `Took back ${take} of ${g.delta} TOKENS (that's all ${u.name.toUpperCase()} had left).` : `Took back ${take} TOKENS from ${u.name.toUpperCase()}.` };
  }
  async staffGive(a, target, amount) {
    const n = Math.floor(+amount); if (!(n >= 1 && n <= 1000)) return { ok: false, msg: "Give between 1 and 1000 tokens." };
    if (!/^[A-Za-z0-9_]{3,12}$/.test(target)) return { ok: false, msg: "No player with that name." };
    const u = await this.env.DB.prepare("SELECT id, name, banned FROM users WHERE name = ?").bind(target).first();
    if (!u || u.banned) return { ok: false, msg: "No player named " + target.toUpperCase() };
    // mods may give tokens to themselves too; it counts toward the same daily limit and is recorded like any other gift
    if (a.staff !== "owner") {
      const since = Date.parse(etDay(Date.now()) + "T00:00:00Z") - 12 * 3600e3;
      const rows = (await this.env.DB.prepare("SELECT delta, t FROM ledger WHERE reason = ? AND t > ?").bind("staff gift by " + a.name, since).all()).results || [];
      const today = rows.filter((r) => etDay(r.t) === etDay(Date.now())).reduce((x, r) => x + r.delta, 0);
      if (today + n > STAFF_GIVE_DAY) return { ok: false, msg: `Mods can give up to ${STAFF_GIVE_DAY} tokens a day. You have ${Math.max(0, STAFF_GIVE_DAY - today)} left today.` };
    }
    const tk = await this.credit(u.id, n, "staff gift by " + a.name);
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === u.id) { if (x.uc) { x.uc.tk = tk; w.serializeAttachment(x); } this.send(w, { t: "tk", tk, msg: `🎁 ${a.name} gave you ${n} TOKENS!` }); } }
    await this.logStaff(a.name, "give", `${u.name.toUpperCase()} ${n}`);
    return { ok: true, msg: `Gave ${u.name.toUpperCase()} ${n} TOKENS.` };
  }
  // the word filter caught this llama (a blocked slur or a masked swear): every 5th time they get a warning pop-up, and staff see it in the log
  async wfHit(ws, a, how) {
    if (!this.wfReady){ try { await this.env.DB.prepare("ALTER TABLE users ADD COLUMN wfn INTEGER NOT NULL DEFAULT 0").run(); } catch (e) {} this.wfReady = true; }
    const r = await this.env.DB.prepare("UPDATE users SET wfn = wfn + 1 WHERE id = ? RETURNING wfn").bind(a.uid).first(); const n = r ? r.wfn : 0;
    if (n && n % 5 === 0){ if (ws) this.send(ws, { t: "wfwarn", n }); await this.logStaff("WORD FILTER", "wfwarn", `${a.name} (${n} times, last: ${how})`); }
  }
  async bugTable() { if (this.bugReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS bugs (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER NOT NULL, name TEXT NOT NULL, t INTEGER NOT NULL, room TEXT, text TEXT NOT NULL, ver TEXT, ua TEXT, scr TEXT, done INTEGER NOT NULL DEFAULT 0)").run(); this.bugReady = true; }
  async bugReport(a, m) {
    await this.bugTable();
    const text = WF.mask(String(m.text || "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, 800)); if (text.length < 5) return { ok: false, msg: "Tell us a little more first." };
    const n = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM bugs WHERE uid = ? AND t > ?").bind(a.uid, Date.now() - 864e5).first(); if (n && n.n >= 5) return { ok: false, msg: "Thanks! You've sent 5 reports today. Try again tomorrow." };
    const s = (v, k) => String(v || "").replace(/[^\x20-\x7e]/g, "").slice(0, k);
    await this.env.DB.prepare("INSERT INTO bugs (uid, name, t, room, text, ver, ua, scr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(a.uid, a.name, Date.now(), s(m.room, 24), text, s(m.ver, 20), s(m.ua, 160), s(m.scr, 12)).run();
    return { ok: true };
  }
  async bugList(a) {   // OWNER ONLY: players' bug reports, open ones first
    if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can see bug reports." };
    await this.bugTable();
    return { ok: true, bugs: (await this.env.DB.prepare("SELECT id, name, t, room, text, ver, ua, scr, done FROM bugs ORDER BY done, id DESC LIMIT 60").all()).results || [] };
  }
  async bugEdit(a, m, del) {
    if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can do that." };
    await this.bugTable(); const id = Math.floor(+m.bid || 0);
    if (del) await this.env.DB.prepare("DELETE FROM bugs WHERE id = ?").bind(id).run(); else await this.env.DB.prepare("UPDATE bugs SET done = ? WHERE id = ?").bind(m.done ? 1 : 0, id).run();
    return { ok: true };
  }
  // ---------- BLOCK: a player you block can't friend you, message you, trade with you, invite you or come into your rooms; their chat is hidden on your screen ----------
  async blockTable() { if (this.blockReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS blocks (uid INTEGER NOT NULL, bid INTEGER NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (uid, bid))").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS blocks_bid ON blocks (bid)").run(); this.blockReady = true; }
  async blockedPair(x, y) { await this.blockTable(); return !!(await this.env.DB.prepare("SELECT 1 FROM blocks WHERE (uid = ? AND bid = ?) OR (uid = ? AND bid = ?)").bind(x, y, y, x).first()); }
  async blockedBy(owner, uid) { await this.blockTable(); return !!(await this.env.DB.prepare("SELECT 1 FROM blocks WHERE uid = ? AND bid = ?").bind(owner, uid).first()); }
  async blockList(uid) { await this.blockTable(); return ((await this.env.DB.prepare("SELECT u.name FROM blocks b JOIN users u ON u.id = b.bid WHERE b.uid = ? ORDER BY u.name").bind(uid).all()).results || []).map((r) => r.name.toUpperCase()); }
  async blockSet(a, m) {
    await this.blockTable(); const n = String(m.n || "").trim();
    if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { ok: false, msg: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name, role FROM users WHERE name = ?").bind(n).first(); if (!u) return { ok: false, msg: "No llama has that name." };
    if (u.id === a.uid) return { ok: false, msg: "You can't block yourself." };
    const them = u.name.toUpperCase();
    if (!m.on) { await this.env.DB.prepare("DELETE FROM blocks WHERE uid = ? AND bid = ?").bind(a.uid, u.id).run(); return { ok: true, blocks: await this.blockList(a.uid), msg: `${them} is unblocked.` }; }
    if (baseRole(this.env, u)) return { ok: false, msg: "You can't block staff. If they did something wrong, tap REPORT." };   // staff have to be able to reach everyone
    const c = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM blocks WHERE uid = ?").bind(a.uid).first(); if (c && c.n >= 200) return { ok: false, msg: "Your block list is full. Unblock someone first." };
    await this.env.DB.prepare("INSERT OR IGNORE INTO blocks (uid, bid, t) VALUES (?, ?, ?)").bind(a.uid, u.id, Date.now()).run();
    try { await this.frDrop(a, { n: u.name }, "remove"); } catch (e) {}   // no longer friends (or asking to be)
    if (this.tradeOf && this.tradeOf.has(a.uid)) { const T = this.trades.get(this.tradeOf.get(a.uid)); if (T && T.side.some((x) => x.uid === u.id)) this.tradeDrop(a.uid, "The trade was cancelled."); }
    // if they're in one of your rooms right now, they head back to the lounge
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || x.uid !== u.id || !x.pres) continue; const pid = prId(x.pres.rm); if (!pid) continue;
      const r = await this.prRoom(pid); if (r && r.owner === a.uid) { x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `You can't stay in ${r.name}, so you headed back to the lounge.` }); } }
    return { ok: true, blocks: await this.blockList(a.uid), msg: `${them} is blocked. You won't see their chat, and they can't message you, trade with you or come into your rooms.` };
  }
  // ---------- REPORT a player: goes to the staff dashboard with their recent chat attached by the server (it can't be faked from the browser) ----------
  async reportTable() { if (this.reportReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER NOT NULL, name TEXT NOT NULL, tuid INTEGER NOT NULL, target TEXT NOT NULL, tstaff TEXT NOT NULL DEFAULT '', t INTEGER NOT NULL, room TEXT, reason TEXT NOT NULL, note TEXT, chat TEXT, done INTEGER NOT NULL DEFAULT 0, by TEXT)").run(); this.reportReady = true; }
  async reportSend(a, m) {
    await this.reportTable(); await this.chatTable();
    const n = String(m.n || "").trim(); if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { ok: false, msg: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name, role FROM users WHERE name = ?").bind(n).first(); if (!u) return { ok: false, msg: "No llama has that name." };
    if (u.id === a.uid) return { ok: false, msg: "You can't report yourself." };
    const reason = String(m.reason || ""); if (!Object.hasOwn(REPORT_REASONS, reason)) return { ok: false, msg: "Pick what happened first." };
    const note = WF.mask(String(m.note || "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, 400));
    const now = Date.now();
    const day = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE uid = ? AND t > ?").bind(a.uid, now - 864e5).first(); if (day && day.n >= 10) return { ok: false, msg: "You've sent 10 reports today. Staff will look at them soon." };
    const dup = await this.env.DB.prepare("SELECT 1 FROM reports WHERE uid = ? AND tuid = ? AND done = 0 AND t > ?").bind(a.uid, u.id, now - 36e5).first(); if (dup) return { ok: false, msg: `You already reported ${u.name.toUpperCase()}. Staff will look at it soon.` };
    const lines = ((await this.env.DB.prepare("SELECT t, rm, text FROM chatlog WHERE uid = ? AND t > ? ORDER BY id DESC LIMIT 15").bind(u.id, now - 2 * 36e5).all()).results || []).reverse();
    const s2 = (v, k) => String(v || "").replace(/[^\x20-\x7e]/g, "").slice(0, k);
    await this.env.DB.prepare("INSERT INTO reports (uid, name, tuid, target, tstaff, t, room, reason, note, chat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(a.uid, a.name, u.id, u.name.toUpperCase(), baseRole(this.env, u), now, s2(m.room, 24), reason, note, JSON.stringify(lines)).run();
    // tell staff who are online right now (a report about a mod or the owner only goes to the owner)
    const tst = baseRole(this.env, u);
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.staff || x.uid === u.id) continue; if (tst && x.staff !== "owner") continue; this.send(w, { t: "toast", msg: `New player report: ${u.name.toUpperCase()}. Open DASHBOARD > REPORTS.` }); }
    return { ok: true, msg: `Thanks. Your report about ${u.name.toUpperCase()} went to the staff.` };
  }
  async reportList(a) {
    const st = await this.staffNow(a); if (!st) return { ok: false, msg: "Only staff can see reports." };
    await this.reportTable();
    // mods never see reports about staff (mods or the owner); only the owner does
    const rows = (await this.env.DB.prepare(`SELECT r.*, u.muted, u.banned FROM reports r LEFT JOIN users u ON u.id = r.tuid ${st === "owner" ? "" : "WHERE r.tstaff = ''"} ORDER BY r.done, r.id DESC LIMIT 80`).all()).results || [];
    return { ok: true, me: st, reports: rows.map((r) => { let chat = []; try { chat = JSON.parse(r.chat || "[]"); } catch (e) {}
      return { id: r.id, by: r.name.toUpperCase(), n: r.target, st: r.tstaff, t: r.t, room: r.room || "", reason: r.reason, note: r.note || "", chat, done: !!r.done, doneBy: r.by || "", muted: !!r.muted, banned: !!r.banned }; }) };
  }
  async reportDone(a, m) {
    const st = await this.staffNow(a); if (!st) return { ok: false, msg: "Only staff can do that." };
    await this.reportTable(); const id = Math.floor(+m.rpid || 0);
    const r = await this.env.DB.prepare("SELECT tstaff FROM reports WHERE id = ?").bind(id).first(); if (!r) return { ok: false, msg: "That report is gone." };
    if (r.tstaff && st !== "owner") return { ok: false, msg: "Only the owner can handle that one." };
    await this.env.DB.prepare("UPDATE reports SET done = ?, by = ? WHERE id = ?").bind(m.done ? 1 : 0, m.done ? a.name : null, id).run();
    return { ok: true };
  }
  // staff only: what the MOD section of a player's card needs (re-checks the caller's role in the database first)
  async modInfo(a, m) {
    const st = await this.staffNow(a); if (!st) return { ok: false, msg: "Only staff can do that." };
    const n = String(m.n || "").trim(); if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { ok: false, msg: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(n).first(); if (!u) return { ok: false, msg: "No llama has that name." };
    await this.reportTable(); const tst = baseRole(this.env, u);
    const reps = (tst && st !== "owner") ? 0 : ((await this.env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE tuid = ? AND done = 0").bind(u.id).first()) || {}).n || 0;
    const can = u.id !== a.uid && tst !== "owner" && (st === "owner" || tst !== "mod");
    return { ok: true, me: st, n: u.name.toUpperCase(), st: tst, muted: !!u.muted, banned: !!u.banned, until: +u.ban_until || 0, wfn: +u.wfn || 0, reports: reps, can };
  }
  async logStaff(by, cmd, target) {
    const log = (await this.ctx.storage.get("modlog")) || [];
    log.unshift({ t: Date.now(), by, cmd, target }); await this.ctx.storage.put("modlog", log.slice(0, 40));
  }
  // Re-reads the caller's role from the database on every staff request, so a removed mod loses access instantly.
  // ---------- server health (OWNER ONLY): players online, slow actions, server errors, blocked floods ----------
  hInit() { if (!this.h) this.h = { t0: Date.now(), acts: 0, slow: 0, errs: 0, drop: 0, msgs: 0, peak: 0 }; return this.h; }
  async healthTable() { if (this.hReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS health (t INTEGER PRIMARY KEY, online INTEGER, peak INTEGER, acts INTEGER, slow INTEGER, errs INTEGER, dropped INTEGER, msgs INTEGER)").run();
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS srvlog (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, kind TEXT, what TEXT, ms INTEGER, detail TEXT)").run(); this.hReady = true; }
  onlineNow() { let n = 0; const rooms = {}; for (const w of this.sockets()) { if (w.readyState !== 1) continue; const rm = this.rmOf(w); if (rm === null) continue; n++; rooms[rm] = (rooms[rm] || 0) + 1; } return { n, rooms }; }
  async healthNote(kind, what, ms, detail) { await this.healthTable();
    await this.env.DB.prepare("INSERT INTO srvlog (t, kind, what, ms, detail) VALUES (?, ?, ?, ?, ?)").bind(Date.now(), kind, what, Math.round(ms) || 0, detail || "").run();
    await this.env.DB.prepare("DELETE FROM srvlog WHERE id <= (SELECT MAX(id) FROM srvlog) - ?").bind(HEALTH.keepLog).run(); }
  async healthTick(now) { const H = this.hInit(); const on = this.onlineNow().n; if (on > H.peak) H.peak = on;
    if (now - H.t0 < HEALTH.everyMs) return;
    this.h = { t0: now, acts: 0, slow: 0, errs: 0, drop: 0, msgs: 0, peak: on };   // start the next window first, so a slow write can't double count
    await this.healthTable();
    await this.env.DB.prepare("INSERT OR REPLACE INTO health (t, online, peak, acts, slow, errs, dropped, msgs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(now, on, H.peak, H.acts, H.slow, H.errs, H.drop, H.msgs).run();
    await this.env.DB.prepare("DELETE FROM health WHERE t < ?").bind(now - HEALTH.keepMs).run(); }
  async health(a) { if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can see server health." };
    await this.healthTable(); const now = Date.now(), H = this.hInit(), on = this.onlineNow();
    const rows = (await this.env.DB.prepare("SELECT t, online, peak, acts, slow, errs, dropped, msgs FROM health WHERE t > ? ORDER BY t DESC LIMIT 400").bind(now - 86400000).all()).results || [];
    const log = (await this.env.DB.prepare("SELECT t, kind, what, ms, detail FROM srvlog ORDER BY id DESC LIMIT 40").all()).results || [];
    return { ok: true, cap: await this.capNow(), queue: this.queueLen(), now: { t: now, online: on.n, rooms: on.rooms, peak: Math.max(H.peak, on.n), acts: H.acts, slow: H.slow, errs: H.errs, dropped: H.drop, msgs: H.msgs, since: H.t0 }, rows, log }; }
  async capSet(a, m) { if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can change the player limit." };
    const n = Math.floor(+m.n || 0); if (!(n >= 1 && n <= 5000)) return { ok: false, msg: "Pick a limit from 1 to 5000." };
    this.cap = n; await this.ctx.storage.put("cap", n); await this.logStaff(a.name, "cap", String(n)); await this.queuePump(); return { ok: true, cap: n, queue: this.queueLen() }; }
  async healthClear(a) { if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can clear that." };
    await this.healthTable(); await this.env.DB.prepare("DELETE FROM srvlog").run(); return { ok: true }; }
  async errList(a) { if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can see that." };
    try { const r = await this.env.DB.prepare("SELECT k, msg, src, line, stack, ua, room, first, last, n, users FROM clienterr ORDER BY last DESC LIMIT 60").all(); return { ok: true, errs: (r.results || []).map((e) => ({ ...e, users: JSON.parse(e.users || "[]") })), owner: a.staff === "owner" }; }
    catch (e) { return { ok: true, errs: [], owner: a.staff === "owner" }; } }
  async errClear(a, m) { if ((await this.staffNow(a)) !== "owner") return { ok: false, msg: "Only the owner can clear errors." };
    if (m.k) await this.env.DB.prepare("DELETE FROM clienterr WHERE k = ?").bind(String(m.k).slice(0, 80)).run(); else await this.env.DB.prepare("DELETE FROM clienterr").run();
    await this.logStaff(a.name, "errclear", m.k ? "ONE ERROR" : "ALL ERRORS"); return { ok: true }; }
  async staffNow(a) { const me = await this.user(a.uid); const st = me && !me.banned ? staffRole(this.env, me) : ""; a.staff = st; return st; }
  async dashboard(a) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can open the dashboard." };
    const online = []; const seen = new Set();
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || seen.has(x.uid)) continue; seen.add(x.uid);
      online.push({ n: x.name, rm: x.pres.rm || "lounge", st: x.staff || "", muted: !!(x.uc && x.uc.muted) }); }
    const rows = async (sql) => ((await this.env.DB.prepare(sql).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), role: r.role }));
    const staff = await rows("SELECT name, role FROM users WHERE role IN ('admin','mod') ORDER BY role, name");
    const muted = await rows("SELECT name, role FROM users WHERE muted = 1 ORDER BY name LIMIT 50");
    await ensureAuthSchema(this.env); await sweepBans(this.env);
    const banned = ((await this.env.DB.prepare("SELECT name, role, ban_until FROM users WHERE banned = 1 ORDER BY name LIMIT 50").all()).results || []).map((r) => ({ n: r.name.toUpperCase(), role: r.role, until: +r.ban_until || 0 }));
    // every token gift by staff, from the permanent ledger (newest first), plus what each mod has given today
    const undone = new Map(); for (const r of ((await this.env.DB.prepare("SELECT reason, delta FROM ledger WHERE reason LIKE 'gift undone #%' ORDER BY id DESC LIMIT 300").all()).results || [])) { const mm = /^gift undone #(\d+) by (\w+)/.exec(r.reason); if (mm) undone.set(+mm[1], { by: mm[2].toUpperCase(), n: -r.delta }); }
    const gifts = ((await this.env.DB.prepare("SELECT l.id, l.delta, l.t, l.reason, u.name FROM ledger l JOIN users u ON u.id = l.uid WHERE l.reason LIKE 'staff gift by %' ORDER BY l.id DESC LIMIT 100").all()).results || [])
      .map((r) => ({ id: r.id, by: r.reason.slice(14).toUpperCase(), to: r.name.toUpperCase(), n: r.delta, t: r.t, undo: undone.get(r.id) || null }));
    const today = {}; for (const g2 of gifts) if (etDay(g2.t) === etDay(Date.now())) today[g2.by] = (today[g2.by] || 0) + g2.n;
    // newest sign-ups: owner only. Mods never receive this list (name and join time only, never emails)
    // bug reports from players: owner only, like the sign-ups list
    let bugs = null;
    if (a.staff === "owner") { await this.bugTable(); bugs = (await this.env.DB.prepare("SELECT id, name, t, room, text, ver, ua, scr, done FROM bugs ORDER BY done, id DESC LIMIT 60").all()).results || []; }
    let signups = null;
    if (a.staff === "owner") signups = ((await this.env.DB.prepare("SELECT name, created FROM users ORDER BY created DESC LIMIT 30").all()).results || []).map((r) => ({ n: r.name.toUpperCase(), t: r.created }));
    return { ok: true, me: a.staff, online, staff, muted, banned, gifts, giftsToday: today, giftCap: STAFF_GIVE_DAY, log: (await this.ctx.storage.get("modlog")) || [], ...(signups ? { signups } : {}), ...(bugs ? { bugs } : {}) };
  }
  async admin(a, m) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can do that." };
    const now = Date.now(); this.staffRate = this.staffRate || new Map();   // at most 20 staff actions a minute per account
    const sr = (this.staffRate.get(a.uid) || []).filter((t) => now - t < 60000);
    if (sr.length >= 20) return { ok: false, msg: "Slow down. Too many staff actions in a minute." }; sr.push(now); this.staffRate.set(a.uid, sr);
    const cmd = String(m.cmd || ""), target = String(m.target || "").trim();
    if (cmd === "give") return this.staffGive(a, target, m.amount);
    const ownerOnly = ["unban", "mod", "unmod", "pkreset"];   // pkreset: clear a staff member's passkeys if they lose their device   // mods can mute, kick and ban players; only the owner can unban or change mods
    if (![...ownerOnly, "mute", "unmute", "kick", "ban"].includes(cmd) || !/^[A-Za-z0-9_]{3,12}$/.test(target)) return { ok: false, msg: a.staff === "owner" ? "Use /mute, /unmute, /kick, /ban, /unban, /mod or /unmod NAME" : "Use /mute, /unmute, /kick or /ban NAME" };
    if (ownerOnly.includes(cmd) && a.staff !== "owner") return { ok: false, msg: "Only the owner can do that." };
    await ensurePk(this.env); const u = await this.env.DB.prepare("SELECT id, name, role, pk_on FROM users WHERE name = ?").bind(target).first();
    if (!u) return { ok: false, msg: "No player named " + target.toUpperCase() };
    const theirs = baseRole(this.env, u);
    if (u.id === a.uid) return { ok: false, msg: "You can't do that to yourself." };
    if (theirs === "owner") return { ok: false, msg: "Nobody can moderate the owner." };
    if (theirs === "mod" && a.staff !== "owner") return { ok: false, msg: "Mods can't moderate other mods." };
    if (cmd === "pkreset"){ await ensurePk(this.env); await this.env.DB.prepare("DELETE FROM passkeys WHERE uid = ?").bind(u.id).run(); await this.env.DB.prepare("UPDATE users SET pk_on = 0, pk_bk = '[]' WHERE id = ?").bind(u.id).run(); await this.logStaff(a.name, cmd, u.name.toUpperCase()); return { ok: true, msg: `${u.name.toUpperCase()}'s passkeys were cleared. They can log in with their password and add a new one.` }; }
    if (cmd === "mute" || cmd === "unmute") await this.env.DB.prepare("UPDATE users SET muted = ? WHERE id = ?").bind(cmd === "mute" ? 1 : 0, u.id).run();
    // ban length: whole hours from 1 to 8760 (a year), or 0 / nothing for permanent
    const hrs = cmd === "ban" ? Math.floor(+m.hours || 0) : 0;
    if (cmd === "ban" && (hrs < 0 || hrs > 8760 || !Number.isFinite(hrs))) return { ok: false, msg: "Pick 1 to 8760 hours, or PERMANENT." };
    const until = cmd === "ban" && hrs > 0 ? Date.now() + hrs * 36e5 : 0, len = hrs > 0 ? `${hrs} ${hrs === 1 ? "HOUR" : "HOURS"}` : "PERMANENTLY";
    if (cmd === "ban" || cmd === "unban") { await ensureAuthSchema(this.env); await this.env.DB.prepare("UPDATE users SET banned = ?, ban_until = ? WHERE id = ?").bind(cmd === "ban" ? 1 : 0, until, u.id).run(); }
    if (cmd === "ban") await this.env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(u.id).run();
    if (cmd === "mod" || cmd === "unmod") await this.env.DB.prepare("UPDATE users SET role = ? WHERE id = ? AND role != 'admin'").bind(cmd === "mod" ? "mod" : "player", u.id).run();
    for (const w of this.sockets()) { const a2 = w.deserializeAttachment(); if (!a2 || a2.uid !== u.id) continue;
      if (cmd === "ban" || cmd === "kick") { this.send(w, { t: "kick", msg: cmd === "ban" ? (hrs > 0 ? `You have been banned from the lounge for ${hrs} ${hrs === 1 ? "hour" : "hours"}.` : "You have been banned from the lounge.") : "You were removed from the lounge." }); try { w.close(4003, cmd); } catch (e) {} }
      else { // their badge and mute show up straight away
        a2.uc = null; const live = cmd === "mod" && u.pk_on ? "mod" : ""; if (cmd === "mod" || cmd === "unmod") a2.staff = live; w.serializeAttachment(a2);
        if (cmd === "mod" || cmd === "unmod") this.send(w, { t: "staff", st: live, pk: cmd === "mod" && !u.pk_on ? "mod" : "", msg: cmd === "mod" ? (u.pk_on ? "You are now a MOD! Open MENU > DASHBOARD." : "You are now a MOD! Add a passkey to switch on your staff tools.") : "You are no longer a mod." }); } }
    await this.logStaff(a.name, cmd, u.name.toUpperCase() + (cmd === "ban" ? (hrs > 0 ? ` FOR ${len}` : " PERMANENTLY") : ""));
    const done = { mute: "muted", unmute: "unmuted", kick: "kicked", ban: hrs > 0 ? `banned for ${len.toLowerCase()}` : "banned permanently", unban: "unbanned", mod: "is now a MOD", unmod: "is no longer a mod" }[cmd];
    return { ok: true, msg: `${u.name.toUpperCase()} ${done}.` };
  }
}
