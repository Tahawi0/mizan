import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const S = createRequire(import.meta.url)("../../assets/srs-core.js");

test("a new card answered right skips to box 2; wrong goes back to box 1", () => {
  const st = {};
  S.grade(st, "straw-man", true, 100);
  assert.deepEqual(st["straw-man"], { box: 2, due: 103, r: 1, w: 0 });
  S.grade(st, "straw-man", true, 103);
  assert.deepEqual(st["straw-man"], { box: 3, due: 110, r: 2, w: 0 });
  S.grade(st, "straw-man", false, 110);
  assert.deepEqual(st["straw-man"], { box: 1, due: 111, r: 2, w: 1 });
});

test("the top box stays the top box", () => {
  const st = { x: { box: 5, due: 0, r: 9, w: 0 } };
  S.grade(st, "x", true, 50);
  assert.equal(st.x.box, 5);
  assert.equal(st.x.due, 80);
});

test("stringify and parse round-trip, and junk is dropped", () => {
  const st = { "ad-hominem": { box: 3, due: 20500, r: 4, w: 2 }, "straw-man": { box: 1, due: 20400, r: 0, w: 1 } };
  assert.deepEqual(S.parse(S.stringify(st)), st);
  assert.deepEqual(S.parse("1|Bad Slug:1:2:3:4,ok:9:1:1:1,ok2:1:-1:0:0,good:2:5:1:0"), { good: { box: 2, due: 5, r: 1, w: 0 } });
  assert.deepEqual(S.parse("not mine"), {});
  assert.deepEqual(S.parse(null), {});
});

test("a full state of 81 slugs fits the 4000-char sync limit", () => {
  const st = {};
  for (let i = 0; i < 81; i++) st["a-rather-long-fallacy-slug-" + i] = { box: 5, due: 99999, r: 999, w: 999 };
  assert.ok(S.stringify(st).length < 4000);
});

test("pick: due cards first, lowest box first, then at most newMax new ones", () => {
  const st = { a: { box: 3, due: 10, r: 2, w: 0 }, b: { box: 1, due: 9, r: 0, w: 1 }, c: { box: 2, due: 99, r: 1, w: 0 } };
  const r = S.pick(st, ["a", "b", "c", "d", "e", "f"], 10, 5, 2);
  assert.deepEqual(r.slugs, ["b", "a", "d", "e"]);
  assert.equal(r.due, 2);
});

test("pick ignores cards that are no longer in the pool", () => {
  const st = { gone: { box: 1, due: 1, r: 0, w: 1 } };
  assert.deepEqual(S.pick(st, ["a"], 10, 3, 0).slugs, []);
});

test("merge keeps the card answered more times, whichever device it came from", () => {
  const a = S.stringify({ x: { box: 4, due: 50, r: 5, w: 1 }, y: { box: 1, due: 9, r: 0, w: 1 } });
  const b = S.stringify({ x: { box: 2, due: 60, r: 2, w: 1 }, z: { box: 2, due: 7, r: 1, w: 0 } });
  const m = S.parse(S.merge(a, b));
  assert.deepEqual(m.x, { box: 4, due: 50, r: 5, w: 1 });
  assert.ok(m.y && m.z);
  assert.equal(S.merge(a, b), S.merge(b, a), "merge is symmetric");
});

test("confusions: counted, merged by max, capped and cleaned", () => {
  let mx = {};
  S.addMix(mx, "straw-man", "red-herring"); S.addMix(mx, "straw-man", "red-herring"); S.addMix(mx, "a", "a");
  assert.deepEqual(mx, { "straw-man>red-herring": 2 });
  assert.equal(S.mergeMix("a>b:3,c>d:1", "a>b:1,e>f:2"), "a>b:3,e>f:2,c>d:1");
  assert.deepEqual(S.parseMix("a>a:3,x>y:2,BAD>y:1"), { "x>y": 2 });
});

test("weak spots need MIN_SEEN answers before saying anything", () => {
  const thin = { a: { box: 1, due: 0, r: 0, w: 2 } };
  assert.deepEqual(S.weak(thin, {}).spots, []);
  assert.equal(S.weak(thin, {}).enough, false);
  const st = { a: { box: 1, due: 0, r: 1, w: 3 }, b: { box: 1, due: 0, r: 2, w: 2 }, c: { box: 5, due: 0, r: 9, w: 0 } };
  const w = S.weak(st, { "a>b": 3, "c>a": 1 });
  assert.deepEqual(w.spots.map((s) => s.slug), ["a", "b"]);
  assert.deepEqual(w.pairs, [{ right: "a", chosen: "b", n: 3 }]);
});

test("shareText merges title, text and url without repeating them", () => {
  assert.deepEqual(S.shareText({ title: "بوست", text: "كل الناس بتقول كده يبقى صح https://fb.com/p/1" }),
    { text: "بوست\nكل الناس بتقول كده يبقى صح", url: "https://fb.com/p/1", onlyUrl: false });
  assert.deepEqual(S.shareText({ title: "كل الناس", text: "كل الناس بتقول كده" }).text, "كل الناس بتقول كده");
  assert.deepEqual(S.shareText({ url: "https://x.com/a" }), { text: "", url: "https://x.com/a", onlyUrl: true });
  assert.deepEqual(S.shareText({ text: "https://x.com/a" }).onlyUrl, true);
  assert.equal(S.shareText({ text: "ا".repeat(2000) }).text.length, 1000);
  assert.deepEqual(S.shareText(), { text: "", url: "", onlyUrl: false });
});

test("record writes state and confusions to storage, and survives a broken storage", () => {
  const m = new Map(), s = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
  assert.equal(S.record(s, "straw-man", false, "red-herring", 10), true);
  S.record(s, "straw-man", true, null, 11);
  assert.deepEqual(S.parse(m.get(S.KEY))["straw-man"], { box: 2, due: 14, r: 1, w: 1 });
  assert.equal(m.get(S.MIX), "straw-man>red-herring:1");
  assert.equal(S.record({ getItem() { throw new Error("blocked"); } }, "a", true, null, 1), false);
});

test("today follows the local calendar day", () => {
  const d = S.today(Date.UTC(2026, 10, 14, 12));
  assert.ok(Number.isInteger(d) && d > 20000);
});

test("Egyptian counting words", () => {
  assert.deepEqual([1, 2, 3, 14].map(S.days), ["بكرة", "بعد يومين", "بعد 3 أيام", "بعد 14 يوم"]);
  assert.deepEqual([1, 2, 5, 12].map(S.cards), ["كارت واحد", "كارتين", "5 كروت", "12 كارت"]);
});
