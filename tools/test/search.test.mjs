import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
const S = createRequire(import.meta.url)("../../assets/search-core.js");

// أسئلة حقيقية زي ما الناس بتكتبها، والصفحة اللي لازم تطلع في أول 3
export const CASES = [
  ["رجل القش", "atlas/straw-man/"],
  ["والشخصنه", "atlas/ad-hominem/"],
  ["بالشخصنة", "atlas/ad-hominem/"],
  ["ابيض واسود", "atlas/false-dilemma/"],
  ["التعميمات المتسرعة", "atlas/hasty-generalization/"],
  ["انحيازات التأكيد", "atlas/confirmation-bias/"],
  ["انحیاز التأکید", "atlas/confirmation-bias/"],
  ["كانط", "philosophy/kant/"],
  ["كانت الفيلسوف", "philosophy/kant/"],
  ["دانينج كروجر", "atlas/dunning-kruger/"],
  ["داننج كروجر", "atlas/dunning-kruger/"],
  ["dunning kruger", "atlas/dunning-kruger/"],
  ["straw man", "atlas/straw-man/"],
  ["سور تشيسترتون", "atlas/chestertons-fence/"],
  ["تاثير الهاله", "atlas/halo-effect/"],
  ["المنحدر الزلق", "atlas/slippery-slope/"],
  ["منحدر زلق", "atlas/slippery-slope/"],
  ["التكلفه الغارقه", "atlas/sunk-cost/"],
  ["ابن رشد", "philosophy/ibn-rushd/"],
  ["إبن خلدون", "philosophy/ibn-khaldun/"],
  ["سقراط", "philosophy/socrates/"],
  ["موس اوكام", "atlas/occams-razor/"],
  ["مغالطه المقامر", "atlas/gamblers-fallacy/"],
  ["النفور من الخساره", "atlas/loss-aversion/"],
  ["الثقة الزائدة", "atlas/overconfidence/"],
  ["مراجعة اليوم", "review/"],
];

const IDX = new URL("../../docs/search.json", import.meta.url);
function load() { return JSON.parse(readFileSync(IDX, "utf8")).map((d) => S.prep({ ...d })); }

test("normalization folds Arabic letter forms, diacritics, Persian keys and digits", () => {
  assert.equal(S.norm("الطُّعْمُ"), "الطعم");
  assert.equal(S.norm("إأآٱ ة ى ی ک ؤ ئ ـ"), "اااا ه ي ي ك و ي");
  assert.equal(S.norm("دانينج-كروجر «٢٠٢٦»"), "دانينج كروجر 2026");
});

test("light stemming strips clitics and suffixes but keeps short words", () => {
  assert.equal(S.stem("والشخصنه"), "شخصن");
  assert.equal(S.stem("بالانحيازات"), "انحياز");
  assert.equal(S.stem("وهم"), "وهم");
  assert.equal(S.stem("fallacies"), "fallaci");
});

test("near() allows the given number of edits and no more", () => {
  assert.ok(S.near("داننج", "دانينج", 1));
  assert.ok(!S.near("كانط", "كتاب", 1));
});

test("real queries find the right page in the top 3", { skip: !existsSync(IDX) && "build the site first" }, () => {
  const idx = load(), miss = [];
  for (const [q, u] of CASES) {
    const top = S.search(idx, q, 3).map((r) => r.d.u);
    if (!top.includes(u)) miss.push(`${q} → ${top.join(", ") || "nothing"}`);
  }
  assert.deepEqual(miss, []);
});

test("nonsense finds nothing, and every term must match", { skip: !existsSync(IDX) && "build the site first" }, () => {
  const idx = load();
  assert.equal(S.search(idx, "زززززز").length, 0);
  assert.ok(!S.search(idx, "كانط سقراط").some((r) => r.d.u === "philosophy/socrates/"), "a typo match in body text must not count");
});
