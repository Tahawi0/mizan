# Mizan Worker API

Base URL: `https://mizan-api.tahawi0.workers.dev`

The Worker (`worker/src/index.js`) serves two sites:

- **Mizan** (Egyptian Arabic): every path below, as written.
- **Blind Spot Lab** (English): the same paths with an `/en` prefix, for example `POST /en/analyze`.

The `/en` prefix only changes four things. Prompts and error messages are in English. KV keys get an `en:` prefix, and so do D1 `uid`s, nicknames and game names. Saved progress keys must start with `bsl-` instead of `mizan-`. Votes, quotas, accounts and league rankings are kept separate per site.

## Conventions

- **Format:** requests and responses are JSON (`Content-Type: application/json; charset=utf-8`).
- **CORS:** only `ALLOWED_ORIGIN` (`https://tahawi0.github.io`) is allowed. `OPTIONS` answers preflight requests.
- **Errors:** every error is `{ "error": "<message>" }`, with a message in the site's language. A quota error also has `"limit": true`.
- **Days:** quota days are UTC (`YYYY-MM-DD`). League and game event days use Cairo time.
- **Anonymous limits:** they are keyed on a SHA-256 hash of `CF-Connecting-IP`, truncated to 16 hex characters. Raw IPs are never stored.
- **Unknown path:** any other path returns `{ "ok": true, "name": "mizan-api" }`, which works as a health check.

### Authentication

Endpoints marked **auth** need a Firebase ID token from project `FIREBASE_PROJECT` (`mizan-ef957`):

```
Authorization: Bearer <Firebase ID token>
```

The Worker checks the RS256 signature against Google's public keys, which it caches for one hour. It also checks `aud`, `iss`, `exp`, `iat` and `auth_time`. A token that fails any check is handled as if no token was sent. The user's row in D1 is created on first use, on the `free` plan.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/analyze` | optional | Find fallacies in a text (Claude) |
| POST | `/debate` | **auth** | Free debate with Zina / Dot (Claude) |
| GET / PUT / DELETE | `/me` | **auth** | Account, saved progress, delete account |
| POST | `/vote` | – | Vote on a dilemma or thought experiment |
| GET | `/votes?id=` | – | Vote counts for one item |
| POST | `/submit` | – | Submit a fallacy you saw, for human review |
| GET / POST | `/lab` | – | Bias-lab experiments (aggregated, anonymous) |
| GET | `/league` | optional | Weekly league table |
| POST / DELETE | `/league/join` | **auth** | Join the league with a nickname, or leave it |
| POST | `/league/score` | **auth** | Record a game score |
| GET / POST | `/evt` | – | Anonymous game counters |
| GET | `/mirror` | – | All votes and lab results in one request (cached 5 min) |

---

### POST /analyze

Analyzes a text for logical fallacies and cognitive biases.

**Request**
```json
{ "text": "15 to 1000 characters" }
```

**Response 200**
```json
{
  "summary": "one sentence (≤300)",
  "findings": [
    { "slug": "straw-man", "quote": "exact quote (≤300)", "why": "≤500", "reply": "how to answer (≤400)" }
  ]
}
```
- `findings` holds at most 3 items. Each `slug` comes from the Worker's `SLUGS` list, and findings with any other slug are dropped.
- Results are cached by a SHA-256 of the text for 30 days. A cached text costs no quota.

**Limits (per day)**
- Anonymous: `DAILY_PER_IP_LIMIT` (5).
- Signed in: `LIMIT_FREE` (10) or `LIMIT_PRO` (50), depending on the plan.
- Whole site: `DAILY_GLOBAL_LIMIT` (300).

Quota is taken before Claude is called. It is given back if Claude fails or returns a reply that is not valid JSON (#1).

**Errors**
- `400`: bad JSON, or text length out of range.
- `429`: per-user/IP limit reached (`limit: true`), or the global limit reached.
- `502`: Claude unavailable, or an unusable reply.

---

### POST /debate

A debate of up to `DEBATE_MAX_TURNS` (6) user turns. Claude argues the opposite side, scores each user message from 1 to 10, and flags up to 2 fallacies per message.

**Start**
```json
{ "action": "start", "topic": "5 to 120 characters", "side": "pro" }
```
`side` is `"pro"` or `"con"`; anything else counts as `"pro"`.

Response:
```json
{ "id": "<uuid>", "reply": "opening argument (≤700)", "left": 2, "max": 6 }
```
`left` is how many debates the user can still start today.

**Turn**
```json
{ "action": "turn", "id": "<uuid>", "text": "5 to 500 characters" }
```

Response:
```json
{
  "reply": "≤700",
  "fallacies": [{ "slug": "ad-hominem", "why": "≤300" }],
  "score": 7,
  "turn": 1,
  "done": false
}
```
On the last turn, `done` is `true` and the response adds `"final"`, a verdict on the whole debate (≤700).

**State:** a debate is stored in KV for 6 hours, and only its owner can continue it.

**Limits**
- Per user: `DEBATE_LIMIT` (3) debates started per day.
- Whole site: `DEBATE_GLOBAL_LIMIT` (600) Claude calls per day, counting starts and turns together.

Quota is given back when Claude fails.

**Errors**
- `400`: bad request or bad lengths.
- `401`: not signed in.
- `403`: the debate belongs to another user.
- `404`: the debate expired.
- `409`: the debate is already over.
- `429`: a limit was reached.
- `502`: Claude failed.

---

### /me (auth)

**GET** returns the account:
```json
{
  "uid": "...", "email": "...", "name": "...", "plan": "free", "created": 1731400000000,
  "progress": { "mizan-streak": "..." },
  "analyze": { "used": 2, "limit": 10 }
}
```

**PUT** saves progress and/or the display name:
```json
{ "progress": { "mizan-<key>": "<string>" }, "name": "≤60 characters" }
```
- The whole body must be under 65,000 characters, otherwise the response is `413`.
- At most 300 progress entries are kept. Each key must match `^mizan-[a-z0-9-]{1,60}$` (`bsl-` on `/en`), and each value must be a string of at most 4,000 characters. Other entries are dropped without an error.
- Sending `progress` replaces the whole stored object.
- Returns the same shape as GET.

**DELETE** deletes the user, their league membership and their league points. Returns `{ "ok": true }`.

---

### POST /vote · GET /votes?id=

**POST /vote**
```json
{ "id": "trolley", "choice": 0 }
```
- `id` must be in `VOTABLE`: the dilemma, weekly-question and thought-experiment ids hard-coded in the Worker.
- `choice` is `0` or `1`.
- Each IP hash gets one vote per item, remembered for a year. A repeat vote changes nothing.

Response: `{ "counts": [<choice 0>, <choice 1>] }`.

**GET /votes?id=** returns `{ "counts": [n0, n1] }`, or `404` for an unknown id.

---

### POST /submit

Saves a fallacy a visitor saw, for human review. Nothing is published automatically.

```json
{ "text": "15 to 600 characters", "where": "≤60", "guess": "≤80" }
```
- **Bot trap:** a non-empty `website` field returns `{ "ok": true }` and saves nothing.
- **Limits:** 3 per IP per day, and 200 for the whole site per day (`429`).
- **Storage:** entries stay in KV for 120 days, under `sub:<ISO time>:<id>`.

---

### /lab

Anonymous, aggregated results for the bias-lab experiments.

| exp | groups | value |
|---|---|---|
| `anchor` | 2 | integer 0–300 (summed) |
| `framing` | 2 | option 0–1 |
| `linda` | 1 | option 0–1 |
| `decoy` | 2 | option 0–2 |

- **GET /lab?exp=anchor** returns `{ "<group>": { "n": 12, "sum": 840, "c": [0,0,0] } }`. An unknown `exp` returns `404`.
- **POST /lab** takes `{ "exp": "framing", "group": 0, "value": 1 }`. Each IP hash counts once per experiment. Returns the updated object.

---

### League

The week starts on Saturday, Cairo time. Points are kept per user, per day and per game, and only the day's best score for each game is kept.

**GET /league** (auth optional)
```json
{
  "week": "2026-11-07", "day": "2026-11-13",
  "top": [{ "nick": "...", "pts": 42 }],
  "last": [{ "nick": "...", "pts": 60 }],
  "members": 120,
  "me": { "member": true, "nick": "...", "pts": 18, "rank": 7, "today": [{ "game": "quiz", "pts": 8 }] }
}
```
- `top` is this week's top 50, and `last` is last week's top 3.
- `me` is `null` without a token, and `{ "member": false }` for a user who has not joined.

**POST /league/join** (auth) takes `{ "nick": "..." }`.
- The nickname must be 2–20 letters, digits, spaces or `_ . -`, and must not contain any word on the block list.
- Nicknames must be unique, ignoring case and separators (`409` if taken).
- Calling it again renames the user.
- Returns `{ "ok": true, "nick": "..." }`.

**DELETE /league/join** (auth) leaves the league and deletes the user's points.

**POST /league/score** (auth) takes `{ "game": "quiz", "pts": 8 }`.
- `game` must be one of: `daily, quiz, court, escape, argue, family, charts, verify, live, rumor, debate, duel`.
- `pts` must be an integer from 0 to 10.
- Returns `{ "ok": true, "member": false }`, and saves nothing, if the user has not joined.

---

### /evt

Anonymous start and finish counters for the games. No user data is stored.

**POST /evt**
```json
{ "g": "court", "e": "start" }
```
- `e` is `"start"`, `"done"`, or `"stage"` together with `"s": 0–49`.
- `g` must be one of: `court, family, escape, argue, spot, calib, fix, charts, verify, rumor, live, debate, quiz, bayes, duel`.
- Each game and event stops counting at 20,000 per day.

**GET /evt?days=7** (1–90 days)
```json
{
  "days": 7, "since": "2026-11-07",
  "games": { "court": { "start": 120, "done": 80, "stages": [120, 101, 92] } },
  "ops": { "analyze": { "used": 40, "limit": 300 }, "debate": { "used": 12, "limit": 600 }, "users": 350, "league": 120 }
}
```
`games` is public: the site's «مرآة الناس» page shows it. `ops` (today's quota use and the number of users and league members) is only included when the request sends an `X-Ops-Key` header that matches the `OPS_KEY` secret. Without the secret set on the Worker, `ops` is never returned. The owner's dashboard at `/ops/` asks for the key once and keeps it in that browser.

---

### GET /mirror

Returns every vote count and every lab result in one request:

```json
{ "votes": { "trolley": [10, 4] }, "lab": { "anchor": { } }, "at": 1731400000000 }
```
The response is cached at the edge for 5 minutes, with a separate cache for each site.

## Storage

| Store | Used for |
|---|---|
| KV `KV` | quotas, vote counts, analysis cache, debate state, submissions, lab results |
| D1 `mizan-db` | `users`, `league_members`, `league_points`, `events` (see `schema.sql`, `league.sql`, `events.sql`) |
| Secret `ANTHROPIC_API_KEY` | Claude calls; never sent to the browser |
| Secret `OPS_KEY` | unlocks the `ops` numbers in `GET /evt` |

KV counters are not atomic, so a burst of parallel requests can pass a limit slightly (#2).

## Content API (static)

The site build also publishes the content as plain JSON on GitHub Pages, so the site, a mobile app or anyone else can read it without calling the Worker. GitHub Pages serves it with `Access-Control-Allow-Origin: *`.

Base URL: `https://tahawi0.github.io/mizan/api/v1/`

| File | What it holds |
|---|---|
| `index.json` | `version` (changes only when content changes), the license, and for each file its `url`, `count` and `hash` |
| `entries.json` | fallacies, biases and thinking tools |
| `philosophy.json` | philosophers and schools |
| `puzzles.json` | the daily puzzles |
| `paths.json` | the short courses |
| `dilemmas.json`, `weekly.json`, `thought.json` | dilemmas, weekly questions, thought experiments |
| `problems.json`, `trends.json` | problems and trend analyses |

A client should fetch `index.json` first and download a file again only when its `hash` changed. The shape of `v1` will not change in a way that breaks clients; a breaking change goes to a new `v2`. The content is CC BY-SA 4.0: credit "Mizan by Mohammed Tahawi".
