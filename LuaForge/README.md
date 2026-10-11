# LuaForge λ

LuaForge is a Lua-first browser playground and language lab. This directory contains the static app and optional maintainer tooling staged on the `project/luaforge` branch of `Asterioxer/Code-Editor` because the active GitHub connector does not provide repository creation.

- `index.html`: playground and landing page
- `src/`: browser app and responsive style system
- `examples/`: runnable Lua samples
- `docs/`: architecture, security, roadmap
- `.github/workflows/`: CI and Pages deployment workflow
- `python/` and `rust/`: optional tools, never required to run the website

The app uses Fengari from jsDelivr to execute Lua locally in the browser. It requires no server. This is a learning tool, not a hardened security sandbox.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000/LuaForge/` when serving the parent repository root.

## Pages

The included workflow publishes the `LuaForge/` directory as a Pages artifact on pushes to `main`. GitHub Pages settings must use **GitHub Actions** as source. To get the clean URL `https://asterioxer.github.io/LuaForge/`, create a new public repository called `LuaForge` and move the directory contents to its root; that final repository-creation operation cannot be completed through the current connector.

Run the structural test suite from this repository root with `python -m unittest discover -s LuaForge/tests -v`.

See docs for safety limitations and architecture. MIT license.
