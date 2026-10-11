# LuaForge architecture

The project keeps the app static so GitHub Pages can serve it without a backend. `index.html` defines the playground; `src/app.js` bridges editor actions to Fengari; the browser VM compiles Lua source and runs it via a protected call. Each run creates and closes a Lua state, and `print()` is captured to the console.

Python is an optional maintainer-side test harness. Rust is an optional local file inspector. Neither is needed to publish or use the site. A fresh Lua state limits state carryover but is not a security boundary; don't expose privileged JavaScript APIs or market the playground as a hardened sandbox.
