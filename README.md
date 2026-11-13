# ميزان — زِن كلامك

مرجع مصري مفتوح عن التفكير الصح: المغالطات والانحيازات والأسئلة الكبيرة، بالعامية المصرية.

- المحتوى في `content/` (ملفات JSON).
- `python build.py` يبني الموقع في `docs/`، وGitHub Pages بيعرضه من هناك.

## الترخيص

- الكود: [MIT](LICENSE).
- المحتوى المكتوب والرسومات: [CC BY-SA 4.0](LICENSE-CONTENT). تقدر تنقل وتعدّل، بشرط تذكر المصدر وتنشر بنفس الترخيص.

---

## English

**Mizan** ("scale") is an open reference on clear thinking, written in Egyptian Arabic: logical fallacies, cognitive biases, thinking tools, philosophers and thought experiments, with interactive games, a daily puzzle and an AI argument analyzer. Live site: <https://tahawi0.github.io/mizan/>. Its English sister site, Blind Spot Lab, runs on the same backend.

### How it is built

| Part | Where | What it is |
|---|---|---|
| Content | `content/*.json` | Every entry, puzzle, path and game, as data |
| Site | `build.py` → `docs/` | A Python script that renders the static site, served by GitHub Pages |
| Front end | `assets/` | Plain JavaScript and CSS, no framework |
| API | `worker/` | A Cloudflare Worker (KV + D1) for analysis, debates, accounts, votes and the league. See [`worker/API.md`](worker/API.md) |

### Run it locally

```
python build.py          # writes the site to docs/
python -m http.server -d docs 8000
```

The site calls the live API at `https://mizan-api.tahawi0.workers.dev` (set in `assets/config.js`).

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Open tasks are in [Issues](https://github.com/Tahawi0/mizan/issues).

### License

Code: [MIT](LICENSE). Written content and artwork: [CC BY-SA 4.0](LICENSE-CONTENT).
