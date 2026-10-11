(() => {
  'use strict';
  const editor = document.querySelector('#codeInput');
  const output = document.querySelector('#consoleOutput');
  const status = document.querySelector('#runStatus');
  const defaults = `print("Hello from LuaForge!")\nlocal total = 0\nfor i = 1, 5 do\n  total = total + i\nend\nprint("sum:", total)`;
  if (!editor || !output) return;
  editor.value = defaults;
  const append = (text, kind = '') => { const line = document.createElement('div'); line.className = `console-line ${kind}`; line.textContent = text; output.append(line); };
  document.querySelector('#runBtn')?.addEventListener('click', () => {
    output.replaceChildren();
    const f = window.fengari;
    if (!f) { append('Lua runtime unavailable. Reload after checking the runtime script.', 'error'); status.textContent = 'Runtime unavailable'; return; }
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = f;
    const state = lauxlib.luaL_newstate(); lualib.luaL_openlibs(state);
    lua.lua_pushcfunction(state, (L) => { const n = lua.lua_gettop(L); const parts = []; for (let i = 1; i <= n; i++) { const value = lua.luaL_tolstring(L, i, null); parts.push(value ? to_jsstring(value) : 'nil'); lua.lua_pop(L, 1); } append(parts.join('\t')); return 0; });
    lua.lua_setglobal(state, to_luastring('print'));
    let result = lauxlib.luaL_loadstring(state, to_luastring(editor.value));
    if (result === lua.LUA_OK) result = lua.lua_pcall(state, 0, lua.LUA_MULTRET, 0);
    if (result !== lua.LUA_OK) { const error = lua.lua_tostring(state, -1); append(to_jsstring(error || to_luastring('Lua error')), 'error'); status.textContent = 'Run failed'; }
    else { if (!output.childElementCount) append('Finished with no output.', 'muted'); status.textContent = 'Finished successfully'; }
    lualib.lua_close(state);
  });
  document.querySelector('#clearBtn')?.addEventListener('click', () => { output.replaceChildren(); status.textContent = 'Console cleared'; });
  document.querySelector('#resetBtn')?.addEventListener('click', () => { editor.value = defaults; output.replaceChildren(); status.textContent = 'Example restored'; });
  editor.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); document.querySelector('#runBtn').click(); } });
})();
