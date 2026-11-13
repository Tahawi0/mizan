// Fakes for the Cloudflare bindings and the outside world, so the Worker runs in plain Node.
// No network: Google's keys and Claude are both answered from here.

export const PROJECT = "mizan-test";

export function fakeKV() {
  const m = new Map();
  return {
    store: m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
  };
}

// Just enough of D1 for the queries the Worker makes: users, and COUNT/SUM reads that start empty.
export function fakeDB() {
  const users = new Map();
  const events = new Map();
  const stmt = (sql) => {
    let args = [];
    const s = {
      bind(...a) { args = a; return s; },
      async first() {
        if (/FROM users WHERE uid=\?/.test(sql)) return users.get(args[0]) || null;
        if (/FROM events WHERE day=\?/.test(sql)) { const n = events.get(args.join("|")); return n ? { n } : null; }
        if (/COUNT\(\*\)|SUM\(/.test(sql)) return { n: 0, s: 0 };
        return null;
      },
      async run() {
        if (/^INSERT INTO users/.test(sql)) {
          const [uid, email, name, plan, progress, created] = args;
          users.set(uid, { uid, email, name, plan, progress, created });
        }
        if (/^UPDATE users SET progress/.test(sql)) {
          const [progress, name, , uid] = args; const u = users.get(uid); if (u) Object.assign(u, { progress, name });
        }
        if (/^INSERT INTO events/.test(sql)) { const k = args.slice(0, 3).join("|"); events.set(k, (events.get(k) || 0) + 1); }
        return { success: true };
      },
      async all() { return { results: [] }; },
    };
    return s;
  };
  return { users, events, prepare: stmt, async batch(list) { for (const x of list) await x.run(); return []; } };
}

export function makeEnv(over = {}) {
  return {
    KV: fakeKV(), DB: fakeDB(), ALLOWED_ORIGIN: "https://tahawi0.github.io", MODEL: "claude-haiku-4-5",
    ANTHROPIC_API_KEY: "test-key", FIREBASE_PROJECT: PROJECT,
    DAILY_GLOBAL_LIMIT: "150", DAILY_PER_IP_LIMIT: "5", LIMIT_FREE: "10", LIMIT_PRO: "50",
    DEBATE_LIMIT: "3", DEBATE_GLOBAL_LIMIT: "80", OPS_KEY: "ops-secret", ...over,
  };
}

// ── Firebase ID tokens signed with a key we control ──
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const pair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const other = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
export const KID = "test-kid";
const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: KID, alg: "RS256", use: "sig" };

export async function token(claims = {}, { key = pair.privateKey, kid = KID } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }));
  const body = b64u(JSON.stringify({
    aud: PROJECT, iss: "https://securetoken.google.com/" + PROJECT, sub: "user-1", email: "u@example.com",
    name: "User One", iat: now - 10, exp: now + 3600, auth_time: now - 10, ...claims,
  }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + body));
  return head + "." + body + "." + b64u(sig);
}
export const wrongKey = other.privateKey;

// ── fetch: Google's public keys, and a scriptable Claude ──
export const claude = { calls: 0, reply: null, status: 200 };
export function setClaude(reply, status = 200) { claude.reply = reply; claude.status = status; claude.calls = 0; }
globalThis.fetch = async (url) => {
  url = String(url);
  if (url.includes("googleapis.com")) return new Response(JSON.stringify({ keys: [jwk] }));
  if (url.includes("api.anthropic.com")) {
    claude.calls++;
    const text = typeof claude.reply === "string" ? claude.reply : JSON.stringify(claude.reply);
    return new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: claude.status });
  }
  throw new Error("unexpected fetch in test: " + url);
};

let ipSeq = 0;
export function req(path, { method = "GET", body, auth, ip, headers = {} } = {}) {
  const h = { "CF-Connecting-IP": ip || "10.0.0." + (++ipSeq), ...headers };
  if (auth) h.Authorization = "Bearer " + auth;
  if (body !== undefined) h["Content-Type"] = "application/json";
  return new Request("https://mizan-api.test" + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
}

let textSeq = 0;
// A fresh Arabic text each call, so the analysis cache never hides a quota check.
export const freshText = () => "ده كلام تجريبي طويل كفاية علشان يتحلل، رقم " + (++textSeq);
