(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const editor = $('#codeInput'), output = $('#consoleOutput'), status = $('#runStatus');
  if (!editor || !output) return;
  const initial = editor.value;
  const snippets = {
    hello: initial,
    tables: 'local tools = {"curiosity", "focus", "iteration"}\nfor i, tool in ipairs(tools) do\n  print(i .. ". " .. tool)\nend',
    loops: 'local total = 0\nfor i = 1, 10 do\n  total = total + i\n  print("step " .. i .. ": " .. total)\nend\nprint("sum = " .. total)',
    functions: 'local function map(fn, items)\n  local result = {}\n  for i, item in ipairs(items) do result[i] = fn(item) end\n  return result\nend\nlocal squares = map(function(n) return n*n end, {1,2,3,4,5})\nprint(table.concat(squares, ", "))'
  };
  const line = (text, kind='') => { const el = document.createElement('div'); el.className = 'console-line ' + kind; el.textContent = text; output.append(el); };
  const run = () => {
    output.replaceChildren();
    if (!window.fengari) { line('Lua runtime is still loading. Check your connection and try again.', 'error'); status.textContent = 'Runtime unavailable'; return; }
    const {lua,lauxlib,lualib,to_luastring,to_jsstring} = window.fengari;
    const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
    lua.lua_pushcfunction(L, state => {
      const count = lua.lua_gettop(state), parts = [];
      for (let i=1; i<=count; i++) { const value=lua.luaL_tolstring(state,i,null); parts.push(value ? to_jsstring(value) : 'nil'); lua.lua_pop(state,1); }
      line(parts.join('\t')); return 0;
    });
    lua.lua_setglobal(L,to_luastring('print'));
    let result=lauxlib.luaL_loadstring(L,to_luastring(editor.value));
    if(result===lua.LUA_OK) result=lua.lua_pcall(L,0,lua.LUA_MULTRET,0);
    if(result!==lua.LUA_OK){const error=lua.lua_tostring(L,-1);line(to_jsstring(error || to_luastring('Lua error')),'error');status.textContent='Run failed';}
    else { if(!output.childElementCount) line('Program finished with no output.','muted'); status.textContent='Finished successfully'; }
    lualib.lua_close(L);
  };
  $('#runBtn').addEventListener('click',run);
  $('#clearBtn').addEventListener('click',()=>{output.replaceChildren();status.textContent='Console cleared';});
  $('#resetBtn').addEventListener('click',()=>{editor.value=initial;output.replaceChildren();status.textContent='Example restored';});
  editor.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run();}if(event.key==='Tab'){event.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');}});
  document.querySelectorAll('.lesson').forEach(card=>card.addEventListener('click',()=>{
    document.querySelectorAll('.lesson').forEach(item=>item.classList.remove('active'));card.classList.add('active');
    editor.value=snippets[card.dataset.code]||initial;status.textContent='Example loaded';
    $('#playground').scrollIntoView({behavior:'smooth',block:'start'});
  }));
})();
