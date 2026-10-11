# LuaForge λ

A Lua-first browser playground and language lab. Write actual Lua, run it locally in your browser, and learn through practical snippets. No backend, account, build step, or install required.

## Contents

- `index.html` — static app entrypoint
- `src/app.js` and `src/styles.css` — editor interaction and responsive styling
- `examples/` — four runnable Lua samples
- `docs/` — architecture, security notes, and roadmap
- `.github/workflows/` — CI checks and GitHub Pages deploy
- `python/` and `rust/` — optional maintainer helper and local inspector; neither is required by Pages

## Run locally

```bash
python -m http.server 8000
```

Open <http://localhost:8000/LuaForge/> when serving the repository root. The full intended standalone site in the downloadable ZIP uses `index.html` at its project root.

## GitHub Pages

The workflow is prepared at `LuaForge/.github/workflows/pages.yml`. To host this directory as a project subfolder, Pages workflow must upload the `LuaForge` directory as the artifact path; no backend is needed. For the clean standalone project URL `https://asterioxer.github.io/LuaForge/`, create a dedicated repository named `LuaForge` and place these project files at its root.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md), [SECURITY.md](docs/SECURITY.md), and [ROADMAP.md](docs/ROADMAP.md).

License: MIT.
