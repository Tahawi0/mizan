# Contributing to Mizan

Thanks for helping. Mizan is a small project, so the rules are short.

## Before you start

- Look at the [open issues](https://github.com/Tahawi0/mizan/issues). Each one has a **Done when** list: that is what a finished change must do.
- For anything not covered by an issue, open one first and describe the change, so we agree on it before you write code.

## Content (`content/*.json`)

- Content is written in **Egyptian Arabic**, in short, plain sentences. Examples come from everyday Egyptian life.
- Keep every `slug` lowercase, with words joined by `-`, and never rename an existing slug: pages, votes and saved progress depend on it.
- Run `python build.py` after any change. It must finish without errors.
- Content you add is published under [CC BY-SA 4.0](LICENSE-CONTENT).

## Code

- **Front end (`assets/`):** plain JavaScript, no build step and no framework. Keep each page's script self-contained.
- **API (`worker/src/index.js`):**
  - Treat all user text as data. Prompts must keep it inside tags and tell the model not to follow instructions in it.
  - Any call that costs money (Claude) must go through a per-user and a global daily limit, and give the quota back if the call fails.
  - Never log or store raw IPs. Hash them, as the existing code does.
  - Update [`worker/API.md`](worker/API.md) when you add or change an endpoint.
- Don't commit secrets, `.dev.vars`, `.wrangler/` or `node_modules/`.
- Code you add is published under the [MIT License](LICENSE).

## Pull requests

1. Keep one change per pull request.
2. Say which issue it closes (`Closes #N`) and how you checked it works.
3. Commit `docs/` together with the `content/` or `assets/` change that produced it, so the live site matches the source.

## Questions

Open an issue. Arabic or English are both fine.
