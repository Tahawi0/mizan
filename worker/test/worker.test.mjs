import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { makeEnv, req, token, wrongKey, setClaude, claude, freshText } from "./helpers.mjs";
import worker from "../src/index.js";

const call = (env, r) => worker.fetch(r, env, { waitUntil() {} });
const json = async (res) => ({ status: res.status, body: await res.json() });
const counters = (env, prefix) => [...env.KV.store].filter(([k]) => k.startsWith(prefix)).map(([, v]) => Number(v));
const GOOD = { summary: "ملخص", findings: [{ slug: "straw-man", quote: "اقتباس", why: "لأن", reply: "رد" }] };

describe("analyze", () => {
  test("rejects text that is too short or too long", async () => {
    const env = makeEnv();
    for (const text of ["قصير", "ا".repeat(1001)]) {
      const r = await json(await call(env, req("/analyze", { method: "POST", body: { text } })));
      assert.equal(r.status, 400);
    }
    assert.equal(claude.calls, 0);
  });

  test("anonymous visitors get DAILY_PER_IP_LIMIT analyses, then 429 with limit:true", async () => {
    const env = makeEnv(); setClaude(GOOD);
    for (let i = 0; i < 5; i++) {
      const r = await call(env, req("/analyze", { method: "POST", ip: "1.1.1.1", body: { text: freshText() } }));
      assert.equal(r.status, 200);
    }
    const r = await json(await call(env, req("/analyze", { method: "POST", ip: "1.1.1.1", body: { text: freshText() } })));
    assert.equal(r.status, 429);
    assert.equal(r.body.limit, true);
    assert.equal(claude.calls, 5);
  });

  test("the global daily limit stops everyone", async () => {
    const env = makeEnv({ DAILY_GLOBAL_LIMIT: "2" }); setClaude(GOOD);
    for (let i = 0; i < 2; i++) assert.equal((await call(env, req("/analyze", { method: "POST", body: { text: freshText() } }))).status, 200);
    assert.equal((await call(env, req("/analyze", { method: "POST", body: { text: freshText() } }))).status, 429);
  });

  test("gives the quota back when Claude fails", async () => {
    const env = makeEnv(); setClaude("boom", 500);
    assert.equal((await call(env, req("/analyze", { method: "POST", body: { text: freshText() } }))).status, 502);
    assert.deepEqual([...counters(env, "ip:"), ...counters(env, "g:")], [0, 0]);
  });

  test("gives the quota back when Claude's reply is not valid JSON (#1)", async () => {
    const env = makeEnv(); setClaude("this is not json at all");
    assert.equal((await call(env, req("/analyze", { method: "POST", body: { text: freshText() } }))).status, 502);
    assert.deepEqual([...counters(env, "ip:"), ...counters(env, "g:")], [0, 0]);
  });

  test("keeps only known slugs, at most 3, with capped lengths", async () => {
    const env = makeEnv();
    setClaude({
      summary: "س".repeat(500),
      findings: [
        { slug: "made-up", quote: "x", why: "x", reply: "x" },
        ...Array.from({ length: 5 }, () => ({ slug: "ad-hominem", quote: "ق".repeat(900), why: "w", reply: "r" })),
      ],
    });
    const r = await json(await call(env, req("/analyze", { method: "POST", body: { text: freshText() } })));
    assert.equal(r.status, 200);
    assert.equal(r.body.findings.length, 3);
    assert.ok(r.body.findings.every((f) => f.slug === "ad-hominem" && f.quote.length === 300));
    assert.equal(r.body.summary.length, 300);
  });

  test("a cached text costs no quota and no Claude call", async () => {
    const env = makeEnv(); setClaude(GOOD);
    const text = freshText();
    await call(env, req("/analyze", { method: "POST", ip: "2.2.2.2", body: { text } }));
    await call(env, req("/analyze", { method: "POST", ip: "2.2.2.2", body: { text } }));
    assert.equal(claude.calls, 1);
    assert.deepEqual(counters(env, "g:"), [1]);
  });
});

describe("Firebase token check", () => {
  const limitFor = async (env, auth) => {
    setClaude(GOOD);
    await call(env, req("/analyze", { method: "POST", auth, body: { text: freshText() } }));
    return { user: counters(env, "uq:").length, anon: counters(env, "ip:").length };
  };

  test("a valid token is counted against the user's own quota", async () => {
    assert.deepEqual(await limitFor(makeEnv(), await token()), { user: 1, anon: 0 });
  });

  for (const [name, make] of [
    ["wrong audience", () => token({ aud: "someone-else" })],
    ["wrong issuer", () => token({ iss: "https://evil.example" })],
    ["expired", () => token({ exp: Math.floor(Date.now() / 1000) - 60 })],
    ["issued in the future", () => token({ iat: Math.floor(Date.now() / 1000) + 3600 })],
    ["signed with another key", () => token({}, { key: wrongKey })],
    ["unknown key id", () => token({}, { kid: "nope" })],
  ]) {
    test(`${name}: treated as anonymous`, async () => {
      assert.deepEqual(await limitFor(makeEnv(), await make()), { user: 0, anon: 1 });
    });
  }

  test("/me needs a valid token", async () => {
    const env = makeEnv();
    assert.equal((await call(env, req("/me"))).status, 401);
    const r = await json(await call(env, req("/me", { auth: await token() })));
    assert.equal(r.status, 200);
    assert.equal(r.body.plan, "free");
    assert.deepEqual(r.body.analyze, { used: 0, limit: 10 });
  });

  test("/me PUT keeps only mizan- progress keys", async () => {
    const env = makeEnv(); const auth = await token();
    const r = await json(await call(env, req("/me", { method: "PUT", auth, body: { progress: { "mizan-streak": "3", "evil": "x", "mizan-big": "x".repeat(5000) } } })));
    assert.deepEqual(r.body.progress, { "mizan-streak": "3" });
  });
});

describe("debate", () => {
  const start = (env, auth, topic = "الشغل من البيت أحسن") => call(env, req("/debate", { method: "POST", auth, body: { action: "start", topic, side: "pro" } }));

  test("needs a signed-in user", async () => {
    assert.equal((await start(makeEnv())).status, 401);
  });

  test("only the owner can continue a debate", async () => {
    const env = makeEnv(); setClaude({ reply: "حجتي الأولى", fallacies: [], score: 0 });
    const s = await json(await start(env, await token()));
    assert.equal(s.status, 200);
    const r = await call(env, req("/debate", { method: "POST", auth: await token({ sub: "user-2" }), body: { action: "turn", id: s.body.id, text: "رأيي كده" } }));
    assert.equal(r.status, 403);
  });

  test("stops after DEBATE_MAX_TURNS and returns a final verdict", async () => {
    const env = makeEnv(); const auth = await token();
    setClaude({ reply: "رد", fallacies: [{ slug: "straw-man", why: "لأن" }, { slug: "made-up", why: "x" }], score: 15, final: "حكم" });
    const { body } = await json(await start(env, auth));
    let last;
    for (let i = 0; i < 6; i++) last = await json(await call(env, req("/debate", { method: "POST", auth, body: { action: "turn", id: body.id, text: "حجة رقم " + i } })));
    assert.equal(last.body.done, true);
    assert.equal(last.body.final, "حكم");
    assert.equal(last.body.score, 10, "score is clamped to 1..10");
    assert.deepEqual(last.body.fallacies.map((f) => f.slug), ["straw-man"]);
    const over = await call(env, req("/debate", { method: "POST", auth, body: { action: "turn", id: body.id, text: "كمان واحدة" } }));
    assert.equal(over.status, 409);
  });

  test("gives both quotas back when Claude fails to open", async () => {
    const env = makeEnv(); setClaude("not json");
    assert.equal((await start(env, await token())).status, 502);
    assert.deepEqual([...counters(env, "dq:"), ...counters(env, "gd:")], [0, 0]);
  });

  test("gives the global quota back when a turn fails", async () => {
    const env = makeEnv(); const auth = await token();
    setClaude({ reply: "افتتاح", fallacies: [], score: 0 });
    const { body } = await json(await start(env, auth));
    setClaude("not json");
    assert.equal((await call(env, req("/debate", { method: "POST", auth, body: { action: "turn", id: body.id, text: "حجتي القوية" } }))).status, 502);
    assert.deepEqual(counters(env, "gd:"), [1], "only the successful opening is counted");
  });
});

describe("votes, ops and CORS", () => {
  test("one vote per visitor per item", async () => {
    const env = makeEnv();
    for (let i = 0; i < 3; i++) await call(env, req("/vote", { method: "POST", ip: "3.3.3.3", body: { id: "trolley", choice: 1 } }));
    const r = await json(await call(env, req("/votes?id=trolley")));
    assert.deepEqual(r.body.counts, [0, 1]);
  });

  test("unknown vote ids are refused", async () => {
    const env = makeEnv();
    assert.equal((await call(env, req("/vote", { method: "POST", body: { id: "nope", choice: 0 } }))).status, 400);
  });

  test("GET /evt shows ops numbers only with the right X-Ops-Key", async () => {
    const env = makeEnv();
    const keys = async (headers) => Object.keys((await json(await call(env, req("/evt?days=1", { headers })))).body);
    assert.ok(!(await keys({})).includes("ops"));
    assert.ok(!(await keys({ "X-Ops-Key": "wrong" })).includes("ops"));
    assert.ok((await keys({ "X-Ops-Key": "ops-secret" })).includes("ops"));
  });

  test("without OPS_KEY set, ops numbers are never shown", async () => {
    const env = makeEnv({ OPS_KEY: undefined });
    const r = await json(await call(env, req("/evt", { headers: { "X-Ops-Key": "anything" } })));
    assert.ok(!("ops" in r.body));
  });

  test("responses allow only the site's origin", async () => {
    const r = await call(makeEnv(), req("/"));
    assert.equal(r.headers.get("Access-Control-Allow-Origin"), "https://tahawi0.github.io");
  });

  test("the /en prefix keeps quotas separate", async () => {
    const env = makeEnv(); setClaude(GOOD);
    await call(env, req("/en/analyze", { method: "POST", body: { text: freshText() } }));
    assert.deepEqual(counters(env, "en:g:"), [1]);
    assert.deepEqual(counters(env, "g:"), []);
  });
});
