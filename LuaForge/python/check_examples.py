from pathlib import Path
root = Path(__file__).resolve().parents[1]
files = sorted((root / 'examples').glob('*.lua'))
if not files or any(not f.read_text(encoding='utf-8').strip() for f in files):
    raise SystemExit('Lua example check failed')
print(f'Validated {len(files)} Lua examples')
